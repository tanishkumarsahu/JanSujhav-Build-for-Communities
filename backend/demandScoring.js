'use strict';

/**
 * Demand Scoring Engine — JanSujhav / People's Priorities
 * 
 * Architecture:
 *   demand_score = α * citizen_score + β * structural_score   (α=0.4, β=0.6)
 * 
 * citizen_score  — same formula for all categories (normalized 0-100)
 * structural_score — per-category formula, each output normalized 0-100
 * 
 * All intermediate values are stored in score_breakdown for transparency.
 */

const { STRUCTURAL_DATA, CITIZEN_SIGNALS } = require('./structuralData');
const { generateContentWithFallbacks } = require('./aiService');
const { query } = require('./db');

// ---------------------------------------------------------------------------
// In-memory caching layer (TTL: 5 minutes for proposals, 15 minutes for comparisons)
// ---------------------------------------------------------------------------
class ScoringCache {
  constructor() {
    this.proposalCache = new Map();
    this.rankingCache = new Map();
    this.comparisonCache = new Map();
    this.CACHE_TTL_PROPOSALS = 5 * 60 * 1000; // 5 min
    this.CACHE_TTL_RANKINGS = 5 * 60 * 1000; // 5 min
    this.CACHE_TTL_COMPARISONS = 15 * 60 * 1000; // 15 min
  }

  getCacheKey(...parts) {
    return parts.map(p => String(p).toLowerCase()).join('::');
  }

  setProposal(proposalId, category, scored) {
    const key = this.getCacheKey('proposal', proposalId, category);
    this.proposalCache.set(key, { data: scored, ts: Date.now() });
  }

  getProposal(proposalId, category) {
    const key = this.getCacheKey('proposal', proposalId, category);
    const entry = this.proposalCache.get(key);
    if (entry && Date.now() - entry.ts < this.CACHE_TTL_PROPOSALS) {
      return entry.data;
    }
    this.proposalCache.delete(key);
    return null;
  }

  setRanking(constituency, scored) {
    const key = this.getCacheKey('ranking', constituency);
    this.rankingCache.set(key, { data: scored, ts: Date.now() });
  }

  getRanking(constituency) {
    const key = this.getCacheKey('ranking', constituency);
    const entry = this.rankingCache.get(key);
    if (entry && Date.now() - entry.ts < this.CACHE_TTL_RANKINGS) {
      return entry.data;
    }
    this.rankingCache.delete(key);
    return null;
  }

  setComparison(idA, idB, note) {
    // Normalize order for consistent caching
    const [a, b] = [String(idA), String(idB)].sort();
    const key = this.getCacheKey('comparison', a, b);
    this.comparisonCache.set(key, { data: note, ts: Date.now() });
  }

  getComparison(idA, idB) {
    const [a, b] = [String(idA), String(idB)].sort();
    const key = this.getCacheKey('comparison', a, b);
    const entry = this.comparisonCache.get(key);
    if (entry && Date.now() - entry.ts < this.CACHE_TTL_COMPARISONS) {
      return entry.data;
    }
    this.comparisonCache.delete(key);
    return null;
  }

  clear() {
    this.proposalCache.clear();
    this.rankingCache.clear();
    this.comparisonCache.clear();
  }

  stats() {
    return {
      proposals: this.proposalCache.size,
      rankings: this.rankingCache.size,
      comparisons: this.comparisonCache.size,
    };
  }
}

const cache = new ScoringCache();

const CATEGORY_TO_SUGGESTION = {
  school_upgrade: 'Education',
  vocational_centre: 'Education',
  road_repair: 'Roads',
  water_supply: 'Water',
  health_centre: 'Health',
  power_grid: 'Electricity',
  sanitation_facility: 'Sanitation',
  community_centre: 'Other',
};


// ---------------------------------------------------------------------------
// Weights — easy to tune without touching formulas
// ---------------------------------------------------------------------------
const WEIGHTS = {
  // Fusion weights
  CITIZEN_ALPHA: 0.40,
  STRUCTURAL_BETA: 0.60,

  // Citizen score sub-weights (must sum ≤ 1 for normalized inputs)
  CITIZEN_LOG_COMPLAINT: 0.40,   // log(complaint_count)
  CITIZEN_SEVERITY:      0.40,   // avg_severity (1-5)
  CITIZEN_RECENCY:       0.20,   // recency weight (days since first reported)

  // School upgrade structural sub-weights
  SCHOOL_CAPACITY_RATIO:  0.65,  // enrollment/capacity overcrowding
  SCHOOL_ALT_DISTANCE:    0.35,  // distance to nearest alternate school

  // Vocational centre structural sub-weights
  VOC_YOUTH_UNEMPLOYMENT: 0.40,
  VOC_CENTRE_DISTANCE:    0.30,
  VOC_INDUSTRY_DEMAND:    0.30,

  // Road repair structural sub-weights
  ROAD_ACCIDENT_SEVERITY:  0.40, // normalized accidents × traffic
  ROAD_CONDITION:          0.35, // inverted surface condition score
  ROAD_CONNECTIVITY:       0.25, // wards connected
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a value to [0, 100].
 */
function clamp100(v) {
  return Math.min(100, Math.max(0, Math.round(v * 10) / 10));
}

/**
 * Calculate recency weight.
 * Proposals reported longer ago score higher (they've been ignored longer).
 * Max age considered: 18 months → score = 100. Fresh (< 1 month) → ~10.
 */
function recencyWeight(firstReportedDate) {
  if (!firstReportedDate) return 50;
  const ageMs = Date.now() - new Date(firstReportedDate).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  // Log-scale: 30 days → ~33, 180 days → ~70, 540 days → ~100
  const raw = Math.log(ageDays + 1) / Math.log(541) * 100;
  return clamp100(raw);
}

/**
 * Normalize citizen signal to 0-100.
 * 
 * citizen_score = w1*log(complaint_count) + w2*severity_score + w3*recency
 * 
 * log scale for complaints (log base 100 → 1 complaint = 0, 100 = 100)
 * severity: (avg_severity - 1) / 4 * 100  (1→0, 5→100)
 */
function computeCitizenScore(signal) {
  const {
    complaint_count = 1,
    avg_severity = 3,
    first_reported_date = null,
  } = signal;

  // Log scale: log(count) / log(200) * 100 (200 complaints = max score)
  const logScore = clamp100(Math.log(Math.max(1, complaint_count)) / Math.log(200) * 100);

  // Severity: normalize 1-5 to 0-100
  const severityScore = clamp100((avg_severity - 1) / 4 * 100);

  // Recency score
  const recency = recencyWeight(first_reported_date);

  const raw =
    WEIGHTS.CITIZEN_LOG_COMPLAINT * logScore +
    WEIGHTS.CITIZEN_SEVERITY * severityScore +
    WEIGHTS.CITIZEN_RECENCY * recency;

  return {
    score: clamp100(raw),
    detail: {
      log_score: clamp100(logScore),
      severity_score: clamp100(severityScore),
      recency_score: clamp100(recency),
      complaint_count,
      avg_severity,
      first_reported_date,
    },
  };
}

// ---------------------------------------------------------------------------
// Category-specific structural scoring functions
// ---------------------------------------------------------------------------

/**
 * School Upgrade structural score (0-100).
 * 
 * Higher overcapacity + farther alternative school = higher score.
 * 
 * capacity_ratio_score: (enrollment/capacity - 1) / 0.8 * 100
 *   → 100% capacity = 0, 180% = 100
 * distance_score: distance / 10 * 100  (10+ km = max score)
 */
function scoreSchoolUpgrade(structural) {
  const { enrollment, sanctioned_capacity, nearest_alt_school_km } = structural;

  const ratio = enrollment / sanctioned_capacity;
  // Above 100% → positive score; max at 180%+
  const ratioScore = clamp100((ratio - 1.0) / 0.8 * 100);

  // Farther alternate = higher need score (max at 10km+)
  const distScore = clamp100(nearest_alt_school_km / 10 * 100);

  const score = clamp100(
    WEIGHTS.SCHOOL_CAPACITY_RATIO * ratioScore +
    WEIGHTS.SCHOOL_ALT_DISTANCE * distScore
  );

  return {
    score,
    detail: {
      enrollment,
      capacity: sanctioned_capacity,
      capacity_ratio_pct: Math.round((ratio) * 100),
      capacity_ratio_score: clamp100(ratioScore),
      nearest_alt_school_km,
      distance_score: clamp100(distScore),
    },
  };
}

/**
 * Vocational Centre structural score (0-100).
 * 
 * Higher youth unemployment + farther centre + higher industry demand = higher score.
 * 
 * unemployment_score: rate / 40 * 100  (40%+ = max)
 * distance_score: km / 20 * 100  (20km+ = max)
 * industry_demand_score: passed through directly (already 0-100)
 */
function scoreVocationalCentre(structural) {
  const {
    youth_unemployment_rate,
    nearest_centre_km,
    local_industry_demand_score,
  } = structural;

  const unemploymentScore = clamp100(youth_unemployment_rate / 40 * 100);
  const distScore = clamp100(nearest_centre_km / 20 * 100);
  const industryScore = clamp100(local_industry_demand_score);

  const score = clamp100(
    WEIGHTS.VOC_YOUTH_UNEMPLOYMENT * unemploymentScore +
    WEIGHTS.VOC_CENTRE_DISTANCE * distScore +
    WEIGHTS.VOC_INDUSTRY_DEMAND * industryScore
  );

  return {
    score,
    detail: {
      youth_unemployment_rate,
      unemployment_score: clamp100(unemploymentScore),
      nearest_centre_km,
      distance_score: clamp100(distScore),
      local_industry_demand_score: industryScore,
    },
  };
}

/**
 * Road Repair structural score (0-100).
 * 
 * Higher accident density + worse surface + more wards connected = higher score.
 * 
 * accident_density: accidents_per_km / 10 * 100  (10+ per km = max)
 *   → also weighted by traffic volume (proxy for impact)
 * condition_score: (100 - surface_score)  (inverted; lower condition = higher need)
 * connectivity_score: wards / 15 * 100  (15+ wards = max)
 */
function scoreRoadRepair(structural) {
  const {
    daily_traffic_volume,
    accident_count_12mo,
    road_length_km,
    wards_connected,
    surface_condition_score,
  } = structural;

  // Accident density per km, amplified by traffic volume proxy
  const accidentsPerKm = accident_count_12mo / Math.max(0.1, road_length_km);
  const trafficFactor = Math.min(2.0, daily_traffic_volume / 30000); // 30k = base
  const accidentScore = clamp100(accidentsPerKm * trafficFactor / 15 * 100);

  // Inverted surface condition (0 condition → 100 need score)
  const conditionScore = clamp100(100 - surface_condition_score);

  // Connectivity
  const connectivityScore = clamp100(wards_connected / 15 * 100);

  const score = clamp100(
    WEIGHTS.ROAD_ACCIDENT_SEVERITY * accidentScore +
    WEIGHTS.ROAD_CONDITION * conditionScore +
    WEIGHTS.ROAD_CONNECTIVITY * connectivityScore
  );

  return {
    score,
    detail: {
      daily_traffic_volume,
      accident_count_12mo,
      road_length_km,
      accidents_per_km: Math.round(accidentsPerKm * 10) / 10,
      accident_score: clamp100(accidentScore),
      surface_condition_score,
      condition_score: clamp100(conditionScore),
      wards_connected,
      connectivity_score: clamp100(connectivityScore),
    },
  };
}

function scoreWaterSupply(structural) {
  const deficit = structural.pipeline_deficit_pct || 70;
  return {
    score: clamp100(deficit),
    detail: { pipeline_deficit_pct: deficit }
  };
}

function scoreHealthCentre(structural) {
  const shortage = structural.beds_shortage_pct || 60;
  return {
    score: clamp100(shortage),
    detail: { beds_shortage_pct: shortage }
  };
}

function scorePowerGrid(structural) {
  const outages = structural.outages_per_month || 12;
  return {
    score: clamp100(outages * 5),
    detail: { outages_per_month: outages }
  };
}

function scoreSanitation(structural) {
  const uncollected = structural.waste_uncollected_pct || 65;
  return {
    score: clamp100(uncollected),
    detail: { waste_uncollected_pct: uncollected }
  };
}

function scoreCommunityCentre(structural) {
  const density = structural.youth_density_score || 75;
  return {
    score: clamp100(density),
    detail: { youth_density_score: density }
  };
}

// ---------------------------------------------------------------------------
// Dispatch table — add new categories here
// ---------------------------------------------------------------------------
const STRUCTURAL_SCORERS = {
  school_upgrade: scoreSchoolUpgrade,
  vocational_centre: scoreVocationalCentre,
  road_repair: scoreRoadRepair,
  water_supply: scoreWaterSupply,
  health_centre: scoreHealthCentre,
  power_grid: scorePowerGrid,
  sanitation_facility: scoreSanitation,
  community_centre: scoreCommunityCentre,
};

const CATEGORY_LABELS = {
  school_upgrade: 'School Upgrade',
  vocational_centre: 'Vocational Centre',
  road_repair: 'Road Repair',
  water_supply: 'Water Supply Extension',
  health_centre: 'Health Centre Upgrade',
  power_grid: 'Power Grid Reinforcement',
  sanitation_facility: 'Sanitation Construction',
  community_centre: 'Community Centre Development',
};

async function getCitizenSignalFromDB(constituency, category, proposalId) {
  const suggestionCategory = CATEGORY_TO_SUGGESTION[category] || 'Other';
  try {
    const res = await query(
      `SELECT 
         COUNT(*)::integer as complaint_count,
         COUNT(DISTINCT user_id)::integer as unique_submitters,
         MIN(created_at) as first_reported_date,
         AVG(CASE WHEN sentiment = 'Negative' THEN 5.0 WHEN sentiment = 'Neutral' THEN 3.0 ELSE 1.0 END)::numeric as avg_severity
       FROM suggestions 
       WHERE LOWER(constituency) = LOWER($1) AND LOWER(category) = LOWER($2) AND status != 'rejected'`,
      [constituency, suggestionCategory]
    );

    const row = res.rows[0];
    if (row && parseInt(row.complaint_count, 10) > 0) {
      // Query individual suggestions contributing to this proposal
      const { rows: suggestionsList } = await query(
        `SELECT id, title, description, category, sentiment, created_at, status
         FROM suggestions
         WHERE LOWER(constituency) = LOWER($1) AND LOWER(category) = LOWER($2) AND status != 'rejected'
         ORDER BY created_at DESC
         LIMIT 5`,
        [constituency, suggestionCategory]
      );

      return {
        complaint_count: parseInt(row.complaint_count, 10),
        avg_severity: parseFloat(row.avg_severity || 3.0),
        unique_submitters: parseInt(row.unique_submitters, 10),
        first_reported_date: row.first_reported_date ? new Date(row.first_reported_date).toISOString().split('T')[0] : null,
        suggestions: suggestionsList
      };
    }
  } catch (err) {
    console.error(`[Scoring] getCitizenSignalFromDB error for ${constituency}/${suggestionCategory}:`, err.message);
  }

  // Fallback to static seed data
  return CITIZEN_SIGNALS[proposalId] || {
    complaint_count: 5,
    avg_severity: 3.0,
    unique_submitters: 3,
    first_reported_date: null,
    suggestions: []
  };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Score a single proposal and return the full demand_score + score_breakdown.
 * @param {object} proposal  - A structural data record
 * @param {string} category  - 'school_upgrade' | 'vocational_centre' | 'road_repair'
 * @param {object} [bulkSignals] - Optional pre-fetched citizen signals map
 * @param {boolean} [skipCache] - Skip cache lookup/set (for bulk operations)
 * @returns {object}         - Scored proposal with demand_score + score_breakdown
 */
async function scoreProposal(proposal, category, bulkSignals = null, skipCache = false) {
  // Try cache first
  if (!skipCache) {
    const cached = cache.getProposal(proposal.proposal_id, category);
    if (cached) {
      return cached;
    }
  }

  let citizenSignal;
  const suggestionCategory = (CATEGORY_TO_SUGGESTION[category] || 'Other').toLowerCase();

  if (bulkSignals && bulkSignals[suggestionCategory]) {
    citizenSignal = bulkSignals[suggestionCategory];
  } else {
    citizenSignal = await getCitizenSignalFromDB(proposal.constituency, category, proposal.proposal_id);
  }

  const citizenResult = computeCitizenScore(citizenSignal);

  const scorer = STRUCTURAL_SCORERS[category];
  if (!scorer) {
    throw new Error(`No structural scorer for category: ${category}`);
  }
  const structuralResult = scorer(proposal);

  const demandScore = clamp100(
    WEIGHTS.CITIZEN_ALPHA * citizenResult.score +
    WEIGHTS.STRUCTURAL_BETA * structuralResult.score
  );

  const scored = {
    proposal_id: proposal.proposal_id,
    category,
    category_label: CATEGORY_LABELS[category],
    constituency: proposal.constituency,
    ward_id: proposal.ward_id,
    location: proposal.location,
    demand_score: demandScore,
    score_breakdown: {
      citizen_component: {
        value: Math.round(citizenResult.score),
        weight_pct: Math.round(WEIGHTS.CITIZEN_ALPHA * 100),
        detail: `${citizenSignal.complaint_count} complaints, avg severity ${citizenSignal.avg_severity}/5, reported ${citizenSignal.first_reported_date}`,
        raw: citizenResult.detail,
        suggestions: citizenSignal.suggestions || [],
      },
      structural_component: {
        value: Math.round(structuralResult.score),
        weight_pct: Math.round(WEIGHTS.STRUCTURAL_BETA * 100),
        detail: buildStructuralDetail(category, structuralResult.detail, proposal),
        raw: structuralResult.detail,
      },
      final_score: Math.round(demandScore),
      // comparison_note is generated by LLM — filled in separately
      comparison_note: null,
    },
    // Preserve original structural data for display
    structural_data: proposal,
    citizen_signal: citizenSignal,
  };

  // Cache the result
  if (!skipCache) {
    cache.setProposal(proposal.proposal_id, category, scored);
  }

  return scored;
}

/**
 * Build a human-readable structural detail string per category.
 */
function buildStructuralDetail(category, detail, proposal) {
  switch (category) {
    case 'school_upgrade':
      return `Enrollment at ${detail.capacity_ratio_pct}% capacity (${detail.enrollment}/${detail.capacity}); nearest alternate school ${detail.nearest_alt_school_km}km away`;
    case 'vocational_centre':
      return `Youth unemployment ${detail.youth_unemployment_rate}% in area; nearest centre ${detail.nearest_centre_km}km; industry demand index ${detail.local_industry_demand_score}/100`;
    case 'road_repair':
      return `${detail.accident_count_12mo} accidents/year, ${detail.accidents_per_km}/km density; surface condition ${detail.surface_condition_score}/100; connects ${detail.wards_connected} wards`;
    case 'water_supply':
      return `Pipeline deficit estimated at ${detail.pipeline_deficit_pct}% compared to standard network design`;
    case 'health_centre':
      return `Hospital bed shortage at ${detail.beds_shortage_pct}% below recommended WHO per-capita limits`;
    case 'power_grid':
      return `Averages ${detail.outages_per_month} major outages/month requiring local grid stabilizer upgrades`;
    case 'sanitation_facility':
      return `Waste collection deficit at ${detail.waste_uncollected_pct}% of total daily volume in ward`;
    case 'community_centre':
      return `Youth/community density score evaluated at ${detail.youth_density_score}/100`;
    default:
      return JSON.stringify(detail);
  }
}

// ---------------------------------------------------------------------------
// Score all proposals and sort by demand_score
// ---------------------------------------------------------------------------

async function rankAllProposals(constituency = null) {
  // Try ranking cache first
  if (constituency) {
    const cached = cache.getRanking(constituency);
    if (cached) {
      return cached;
    }
  }

  const results = [];
  try {
    let dbQuery = 'SELECT * FROM proposals';
    const params = [];
    if (constituency) {
      dbQuery = 'SELECT * FROM proposals WHERE LOWER(constituency) = LOWER($1)';
      params.push(constituency.trim());
    }
    
    const { rows: dbProposals } = await query(dbQuery, params);

    // Fetch bulk signals if constituency is set to avoid N+1 queries
    let bulkSignals = null;
    if (constituency) {
      bulkSignals = {};
      try {
        const aggregatesRes = await query(
          `SELECT 
             LOWER(category) as cat,
             COUNT(*)::integer as complaint_count,
             COUNT(DISTINCT user_id)::integer as unique_submitters,
             MIN(created_at) as first_reported_date,
             AVG(CASE WHEN sentiment = 'Negative' THEN 5.0 WHEN sentiment = 'Neutral' THEN 3.0 ELSE 1.0 END)::numeric as avg_severity
           FROM suggestions 
           WHERE LOWER(constituency) = LOWER($1) AND status != 'rejected'
           GROUP BY LOWER(category)`,
          [constituency.toLowerCase()]
        );

        for (const row of aggregatesRes.rows) {
          bulkSignals[row.cat] = {
            complaint_count: parseInt(row.complaint_count, 10),
            avg_severity: parseFloat(row.avg_severity || 3.0),
            unique_submitters: parseInt(row.unique_submitters, 10),
            first_reported_date: row.first_reported_date ? new Date(row.first_reported_date).toISOString().split('T')[0] : null,
            suggestions: []
          };
        }

        const { rows: suggestionsList } = await query(
          `SELECT id, title, description, LOWER(category) as cat, sentiment, created_at, status
           FROM suggestions
           WHERE LOWER(constituency) = LOWER($1) AND status != 'rejected'
           ORDER BY created_at DESC`,
          [constituency.toLowerCase()]
        );

        for (const s of suggestionsList) {
          if (bulkSignals[s.cat]) {
            if (bulkSignals[s.cat].suggestions.length < 5) {
              bulkSignals[s.cat].suggestions.push(s);
            }
          }
        }
      } catch (err) {
        console.error('[Scoring] Failed to fetch bulk signals:', err.message);
      }
    }

    if (dbProposals.length > 0) {
      // Score proposals in parallel batches (max 10 concurrent)
      const batchSize = 10;
      for (let i = 0; i < dbProposals.length; i += batchSize) {
        const batch = dbProposals.slice(i, i + batchSize);
        const scoringPromises = batch.map(row =>
          scoreProposal(row.structural_data, row.category, bulkSignals, true).catch(err => {
            console.error(`[Scoring] Failed to score proposal ${row.proposal_id}:`, err.message);
            return null;
          })
        );
        const scored = await Promise.all(scoringPromises);
        results.push(...scored.filter(s => s !== null));
      }
    } else {
      throw new Error('Proposals table empty');
    }
  } catch (err) {
    console.warn('[Scoring] DB proposals query failed or empty, falling back to static seed data:', err.message);
    const filterConstituency = constituency ? constituency.toLowerCase() : null;
    for (const [category, proposals] of Object.entries(STRUCTURAL_DATA)) {
      for (const proposal of proposals) {
        if (filterConstituency && proposal.constituency.toLowerCase() !== filterConstituency) {
          continue;
        }
        try {
          const scored = await scoreProposal(proposal, category, null, true);
          results.push(scored);
        } catch (err) {
          console.error(`[Scoring] Failed to score fallback ${proposal.proposal_id}:`, err.message);
        }
      }
    }
  }

  results.sort((a, b) => b.demand_score - a.demand_score);

  // Cache the ranking if we have a constituency filter
  if (constituency) {
    cache.setRanking(constituency, results);
  }

  return results;
}

// ---------------------------------------------------------------------------
// LLM comparison note generator
// ---------------------------------------------------------------------------

/**
 * Generate a one-line comparison note between two competing proposals.
 * Uses Gemini to write a judge-memorable sentence. Results are cached for 15 minutes.
 * 
 * @param {object} higher  - Higher-ranked proposal (with score_breakdown)
 * @param {object} lower   - Lower-ranked proposal (with score_breakdown)
 * @returns {Promise<string>} One-sentence comparison note
 */
async function generateComparisonNote(higher, lower) {
  // Check cache first
  const cached = cache.getComparison(higher.proposal_id, lower.proposal_id);
  if (cached) {
    return cached;
  }

  try {
    const prompt = `You are a concise public policy analyst. In exactly ONE sentence (max 40 words), explain why Proposal A is ranked higher than Proposal B based on their score breakdowns.

Proposal A — "${higher.category_label}" in ${higher.location?.area || higher.constituency} (Score: ${higher.demand_score}/100):
- Citizen: ${higher.score_breakdown.citizen_component.detail}
- Structural: ${higher.score_breakdown.structural_component.detail}

Proposal B — "${lower.category_label}" in ${lower.location?.area || lower.constituency} (Score: ${lower.demand_score}/100):
- Citizen: ${lower.score_breakdown.citizen_component.detail}
- Structural: ${lower.score_breakdown.structural_component.detail}

Write a single sentence starting with "Ranked above" that contrasts the key differentiating factor. Be specific with numbers. No markdown.`;

    const text = await generateContentWithFallbacks(prompt);
    const result = text.trim().replace(/\n/g, ' ');
    
    // Cache the result
    cache.setComparison(higher.proposal_id, lower.proposal_id, result);
    
    return result;
  } catch (err) {
    console.error('[Scoring] generateComparisonNote error:', err.message);
    const fallback = `Ranked above due to higher combined citizen demand (${higher.score_breakdown.citizen_component.value}) and structural need (${higher.score_breakdown.structural_component.value}) vs. ${lower.score_breakdown.structural_component.value}.`;
    
    // Cache fallback too
    cache.setComparison(higher.proposal_id, lower.proposal_id, fallback);
    
    return fallback;
  }
}

module.exports = {
  rankAllProposals,
  scoreProposal,
  generateComparisonNote,
  STRUCTURAL_DATA,
  CITIZEN_SIGNALS,
  WEIGHTS,
  cache, // Expose cache for monitoring/debugging
  getCache: () => cache.stats(), // Get cache stats
  clearCache: () => cache.clear(), // Manual cache clearing
};
