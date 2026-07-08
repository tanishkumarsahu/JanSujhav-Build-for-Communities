'use strict';

const express = require('express');
const router = express.Router();
const { query, getParentConstituency } = require('../db');
const {
  rankAllProposals,
  scoreProposal,
  generateComparisonNote,
  STRUCTURAL_DATA,
} = require('../demandScoring');


// Helper to dynamically seed template proposals for a new constituency if they don't exist in the DB
async function ensureProposalsForConstituency(constituency) {
  if (!constituency) return;
  const cName = constituency.trim();
  try {
    const { rows: countRows } = await query(
      'SELECT COUNT(*) as cnt FROM proposals WHERE LOWER(constituency) = LOWER($1)',
      [cName]
    );
    if (parseInt(countRows[0].cnt, 10) === 0) {
      console.log(`[DB] Dynamically seeding proposals for new constituency: "${cName}"`);
      const { STRUCTURAL_DATA } = require('../structuralData');
      for (const [category, proposals] of Object.entries(STRUCTURAL_DATA)) {
        for (const p of proposals) {
          const newId = `${p.proposal_id}_${cName.replace(/\s+/g, '_').toLowerCase()}`;
          const clonedProp = {
            ...p,
            proposal_id: newId,
            constituency: cName,
          };
          await query(
            `INSERT INTO proposals (proposal_id, category, constituency, ward_id, location_lat, location_lng, location_area, structural_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (proposal_id) DO NOTHING`,
            [
              newId,
              category,
              cName,
              p.ward_id,
              p.location?.lat || null,
              p.location?.lng || null,
              p.location?.area || null,
              JSON.stringify(clonedProp)
            ]
          );
        }
      }
      console.log(`[DB] Dynamic seeding complete for "${cName}".`);
    }
  } catch (err) {
    console.error(`[DB] ensureProposalsForConstituency error for "${cName}":`, err.message);
  }
}

// ---------------------------------------------------------------------------
// GET /api/proposals/ranked
// Returns all proposals ranked by demand_score, optionally filtered by constituency.
// Also returns a comparison_note between rank #1 and #2 (one LLM call).
// ---------------------------------------------------------------------------
router.get('/ranked', async (req, res) => {
  try {
    const { constituency, category, limit: limitStr } = req.query;
    const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 20));

    const parentPC = constituency && constituency.trim() ? getParentConstituency(constituency.trim()) : null;

    if (parentPC) {
      await ensureProposalsForConstituency(parentPC);
    }

    let ranked = await rankAllProposals();
    let fallback_note = null;
    const meta = {
      scoring_weights: {
        citizen_alpha: 0.40,
        structural_beta: 0.60,
      },
      categories_covered: ['school_upgrade', 'vocational_centre', 'road_repair'],
      data_source: 'Seeded from UDISE+/MoLE/MoRTH patterns — real pipeline ready',
    };

    // Optional filters
    if (parentPC) {
      const filtered = ranked.filter(p =>
        p.constituency.toLowerCase() === parentPC.toLowerCase()
      );
      if (filtered.length > 0) {
        ranked = filtered;
      } else {
        fallback_note = `No proposals recorded for "${parentPC}" yet. Showing all active proposals.`;
        meta.fallback_note = fallback_note;
      }
    }
    if (category && category.trim()) {
      ranked = ranked.filter(p => p.category === category.trim());
    }

    const sliced = ranked.slice(0, limit);

    // Generate comparison note between top 2 proposals (if we have at least 2)
    let comparisonNote = null;
    if (sliced.length >= 2) {
      try {
        comparisonNote = await generateComparisonNote(sliced[0], sliced[1]);
        // Attach to the top-ranked proposal's breakdown
        sliced[0].score_breakdown.comparison_note = comparisonNote;
      } catch (err) {
        console.error('[Proposals] Comparison note generation failed:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        proposals: sliced,
        total: ranked.length,
        filters_applied: {
          constituency: constituency || null,
          category: category || null,
        },
        meta,
      },
    });
  } catch (err) {
    console.error('[Proposals] /ranked error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to rank proposals' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/proposals/categories
// Returns available categories with proposal counts.
// ---------------------------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const categorySummary = Object.entries(STRUCTURAL_DATA).map(([cat, proposals]) => ({
      category: cat,
      label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: proposals.length,
    }));

    return res.status(200).json({
      success: true,
      data: { categories: categorySummary },
    });
  } catch (err) {
    console.error('[Proposals] /categories error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/proposals/:id
// Returns a single proposal by proposal_id, with full score breakdown.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resDb = await query('SELECT * FROM proposals WHERE LOWER(proposal_id) = LOWER($1)', [id]);
    const row = resDb.rows[0];

    if (!row) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const scored = await scoreProposal(row.structural_data, row.category);

    return res.status(200).json({
      success: true,
      data: { proposal: scored },
    });
  } catch (err) {
    console.error('[Proposals] /:id error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch proposal' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/proposals/compare
// Accepts two proposal IDs, returns both with a fresh LLM comparison note.
// ---------------------------------------------------------------------------
router.post('/compare', async (req, res) => {
  try {
    const { proposal_id_a, proposal_id_b } = req.body;

    if (!proposal_id_a || !proposal_id_b) {
      return res.status(400).json({
        success: false,
        error: 'proposal_id_a and proposal_id_b are required',
      });
    }

    const findAndScore = async (pid) => {
      const resDb = await query('SELECT * FROM proposals WHERE LOWER(proposal_id) = LOWER($1)', [pid]);
      const row = resDb.rows[0];
      if (row) {
        return await scoreProposal(row.structural_data, row.category);
      }
      return null;
    };

    const proposalA = await findAndScore(proposal_id_a);
    const proposalB = await findAndScore(proposal_id_b);

    if (!proposalA) return res.status(404).json({ success: false, error: `Proposal ${proposal_id_a} not found` });
    if (!proposalB) return res.status(404).json({ success: false, error: `Proposal ${proposal_id_b} not found` });

    // Ensure A is the higher-ranked one for note generation
    const [higher, lower] = proposalA.demand_score >= proposalB.demand_score
      ? [proposalA, proposalB]
      : [proposalB, proposalA];

    const note = await generateComparisonNote(higher, lower);
    higher.score_breakdown.comparison_note = note;

    return res.status(200).json({
      success: true,
      data: {
        higher_ranked: higher,
        lower_ranked: lower,
        comparison_note: note,
      },
    });
  } catch (err) {
    console.error('[Proposals] /compare error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to compare proposals' });
  }
});

module.exports = router;
