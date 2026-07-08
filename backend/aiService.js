'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('./db');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences (```json ... ```) from Gemini responses.
 * @param {string} text
 * @returns {string}
 */
function stripCodeFences(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Safely parse JSON from a Gemini response string.
 * Strips fences before parsing.
 * @param {string} text
 * @returns {any|null}
 */
function safeParseJSON(text) {
  try {
    const cleaned = stripCodeFences(text);
    return JSON.parse(cleaned);
  } catch (err) {
    // Sometimes Gemini returns the JSON wrapped inside prose; try to extract it.
    try {
      const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (_) {
      // ignore
    }
    console.error('[AI] JSON parse failed. Raw text:', text && text.substring(0, 200));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Model management
// ---------------------------------------------------------------------------

/**
 * Fetch the active Gemini model name from the settings table.
 * Falls back to env var or hardcoded default on any error.
 * @returns {Promise<string>}
 */
async function getActiveModel() {
  try {
    const result = await query("SELECT value FROM settings WHERE key = 'active_model'", []);
    if (result.rows.length > 0) {
      return result.rows[0].value;
    }
  } catch (err) {
    console.error('[AI] getActiveModel DB error:', err.message);
  }
  return process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash';
}

/**
 * Return a configured GoogleGenerativeAI client instance.
 * @returns {GoogleGenerativeAI}
 */
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Get the active generative model instance (reads model name from DB each call).
 * @returns {Promise<import('@google/generative-ai').GenerativeModel>}
 */
async function getModel() {
  const modelName = await getActiveModel();
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({ model: modelName });
}

const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];

/**
 * Helper to call generateContent with sequential fallbacks.
 * @param {string} prompt 
 * @returns {Promise<string>} raw response text
 */
async function generateContentWithFallbacks(prompt) {
  const primaryModelName = await getActiveModel();
  const modelsToTry = [primaryModelName, ...FALLBACK_MODELS];
  
  const genAI = getGeminiClient();
  let lastError = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting generateContent with model: ${modelName}`);
      const modelInstance = genAI.getGenerativeModel({ model: modelName });
      const result = await modelInstance.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[AI] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  
  throw lastError || new Error('All generative models failed');
}

// ---------------------------------------------------------------------------
// analyzeSuggestion
// ---------------------------------------------------------------------------

/**
 * Analyze a citizen suggestion and return enrichment metadata.
 * @param {string} description - The raw suggestion text
 * @param {string} [language='en'] - Language code of the description
 * @returns {Promise<{translated_text, category, sentiment, ai_tags, summary}|null>}
 */
async function analyzeSuggestion(description, language = 'en') {
  try {
    if (!description || description.trim().length === 0) {
      return null;
    }

    const prompt = `You are an AI assistant for a constituency development platform in India.
Analyze the following citizen suggestion and return a JSON object with exactly these fields:
{
  "translated_text": "English translation of the text (if already English, return the same text)",
  "category": "One of: Roads | Water | Education | Health | Electricity | Sanitation | Other",
  "sentiment": "One of: Positive | Negative | Neutral",
  "ai_tags": ["array", "of", "2-5", "relevant", "short", "tags"],
  "summary": "One-sentence summary of the suggestion in English"
}

Language of the suggestion: ${language}
Suggestion text:
"""
${description}
"""

IMPORTANT: Return ONLY the raw JSON object. No markdown fences, no explanation.`;

    const text = await generateContentWithFallbacks(prompt);

    const parsed = safeParseJSON(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.error('[AI] analyzeSuggestion: unexpected parse result');
      return null;
    }

    // Normalize / validate fields
    const validCategories = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];
    const validSentiments = ['Positive', 'Negative', 'Neutral'];

    return {
      translated_text: typeof parsed.translated_text === 'string' ? parsed.translated_text : description,
      category: validCategories.includes(parsed.category) ? parsed.category : 'Other',
      sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'Neutral',
      ai_tags: Array.isArray(parsed.ai_tags) ? parsed.ai_tags.slice(0, 10) : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  } catch (err) {
    console.error('[AI] analyzeSuggestion error:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// generateRecommendations
// ---------------------------------------------------------------------------

/**
 * Generate AI development recommendations for a constituency.
 * @param {string} constituency
 * @param {Array}  suggestions
 * @param {object} demographics
 * @param {Array}  infrastructureGaps
 * @returns {Promise<Array>}
 */
async function generateRecommendations(constituency, suggestions, demographics, infrastructureGaps) {
  try {
    const categoryCount = {};
    for (const s of suggestions) {
      categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
    }

    const prompt = `You are an AI urban planning and constituency development expert for India.
Based on the following data for "${constituency}" constituency, generate up to 10 prioritized development project recommendations.

## Demographics
${JSON.stringify(demographics, null, 2)}

## Infrastructure Gaps
${JSON.stringify(infrastructureGaps, null, 2)}

## Citizen Suggestions Summary
Total suggestions: ${suggestions.length}
Category breakdown: ${JSON.stringify(categoryCount)}

## Sample Citizen Suggestions (up to 10)
${JSON.stringify(suggestions.slice(0, 10).map(s => ({ title: s.title, category: s.category, sentiment: s.sentiment })), null, 2)}

Return a JSON array of up to 10 recommendations, each with:
{
  "title": "Short project title",
  "description": "Detailed 2-3 sentence project description",
  "category": "Roads | Water | Education | Health | Electricity | Sanitation | Other",
  "priority_score": <integer 1-100>,
  "estimated_cost": <number in INR — integer>,
  "rationale": "2-3 sentence explanation of why this project is prioritized",
  "supporting_suggestions_count": <integer — how many citizen suggestions support this>
}

Sort by priority_score descending. Consider population, literacy, income level, severity of gaps, and volume of citizen feedback.

IMPORTANT: Return ONLY the raw JSON array. No markdown, no fences, no extra text.`;

    const text = await generateContentWithFallbacks(prompt);

    const parsed = safeParseJSON(text);
    if (!Array.isArray(parsed)) {
      console.error('[AI] generateRecommendations: result is not an array');
      return [];
    }

    const validCategories = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];
    return parsed
      .filter(r => r && typeof r === 'object')
      .map(r => ({
        title: String(r.title || 'Untitled Project'),
        description: String(r.description || ''),
        category: validCategories.includes(r.category) ? r.category : 'Other',
        priority_score: Math.min(100, Math.max(1, parseInt(r.priority_score, 10) || 50)),
        estimated_cost: parseFloat(r.estimated_cost) || 0,
        rationale: String(r.rationale || ''),
        supporting_suggestions_count: parseInt(r.supporting_suggestions_count, 10) || 0,
      }))
      .slice(0, 10);
  } catch (err) {
    console.error('[AI] generateRecommendations error:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// filterNewsByQuery
// ---------------------------------------------------------------------------

/**
 * Use Gemini to filter and rank news articles by relevance to a query.
 * @param {string} query      - User search/filter query
 * @param {Array}  articles   - Array of { id, headline, summary, category }
 * @returns {Promise<Array<number>>} Array of article IDs in relevance order
 */
async function filterNewsByQuery(queryString, articles) {
  try {
    if (!articles || articles.length === 0) return [];
    if (!queryString || queryString.trim().length === 0) {
      return articles.map(a => a.id);
    }

    const prompt = `You are an AI news relevance engine for a constituency development platform.

Given the user query and a list of news articles, return the IDs of articles that are relevant to the query, sorted by relevance (most relevant first).

User Query: "${queryString}"

Articles:
${JSON.stringify(articles.map(a => ({ id: a.id, headline: a.headline, summary: a.summary, category: a.category })), null, 2)}

Return a JSON array of article IDs (numbers) sorted by relevance. Only include articles that are relevant.
Example: [12, 7, 3]

IMPORTANT: Return ONLY the raw JSON array of IDs. No markdown, no fences, no explanation.`;

    const text = await generateContentWithFallbacks(prompt);

    const parsed = safeParseJSON(text);
    if (!Array.isArray(parsed)) {
      console.error('[AI] filterNewsByQuery: result is not an array');
      return articles.map(a => a.id);
    }

    // Validate each element is a number/parseable ID
    return parsed
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));
  } catch (err) {
    console.error('[AI] filterNewsByQuery error:', err.message);
    return articles ? articles.map(a => a.id) : [];
  }
}

// ---------------------------------------------------------------------------
// enrichNewsArticle
// ---------------------------------------------------------------------------

/**
 * Enrich a news article with category, sentiment, and tags.
 * @param {string} headline
 * @param {string} summary
 * @returns {Promise<{ category: string, sentiment: string, ai_tags: string[] }>}
 */
async function enrichNewsArticle(headline, summary) {
  const defaults = { category: 'General', sentiment: 'Neutral', ai_tags: [] };
  try {
    if (!headline) return defaults;

    const prompt = `You are a news classification AI for an Indian constituency development platform.

Given this news article, return a JSON object with:
{
  "category": "One of: Roads | Water | Education | Health | Electricity | Sanitation | Politics | Economy | Crime | Environment | Sports | Other",
  "sentiment": "One of: Positive | Negative | Neutral",
  "ai_tags": ["2-5 short relevant tags"]
}

Headline: "${headline}"
Summary: "${summary || ''}"

IMPORTANT: Return ONLY the raw JSON object. No markdown, no fences, no explanation.`;

    const text = await generateContentWithFallbacks(prompt);

    const parsed = safeParseJSON(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaults;
    }

    const validCategories = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Politics', 'Economy', 'Crime', 'Environment', 'Sports', 'Other', 'General'];
    const validSentiments = ['Positive', 'Negative', 'Neutral'];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : 'General',
      sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'Neutral',
      ai_tags: Array.isArray(parsed.ai_tags) ? parsed.ai_tags.slice(0, 10) : [],
    };
  } catch (err) {
    console.error('[AI] enrichNewsArticle error:', err.message);
    return defaults;
  }
}

/**
 * Generate dynamic structural contexts and area names for all categories in a seeded constituency using a single Gemini call.
 * @param {string} constituency
 * @param {string[]} categoriesList
 * @returns {Promise<object|null>}
 */
async function generateAllProposalsContext(constituency, categoriesList) {
  try {
    const prompt = `You are a public policy analyst specializing in Indian constituency development.
For the constituency "${constituency}", write a realistic, local-sounding structural context detail for each of the following development categories:
${categoriesList.join(', ')}

Generate a JSON object where the keys are the categories and the values are objects with exactly these fields:
{
  "citizen_context": "A detailed 1-2 sentence description of a realistic local issue for this category in ${constituency}. Mention specific realistic local area names if possible.",
  "location_area": "A realistic neighborhood or area name in ${constituency} (e.g. ward, locality, or block name)"
}

Example output:
{
  "school_upgrade": {
    "citizen_context": "...",
    "location_area": "..."
  },
  "road_repair": {
    "citizen_context": "...",
    "location_area": "..."
  }
}

IMPORTANT: Return ONLY the raw JSON object. No markdown, no fences, no extra text.`;

    const text = await generateContentWithFallbacks(prompt);
    const parsed = safeParseJSON(text);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    console.error('[AI] generateAllProposalsContext error:', err.message);
  }
  return null;
}

module.exports = {
  getActiveModel,
  getGeminiClient,
  getModel,
  analyzeSuggestion,
  generateRecommendations,
  filterNewsByQuery,
  enrichNewsArticle,
  generateAllProposalsContext,
  generateContentWithFallbacks,
};
