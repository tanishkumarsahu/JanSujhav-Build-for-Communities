'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Execute a parameterized query against the pool.
 * @param {string} text  - SQL text
 * @param {Array}  params - Bound parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DB] query executed in ${duration}ms — rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error('[DB] Query error:', err.message, '\nSQL:', text);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Schema DDL
// ---------------------------------------------------------------------------
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'citizen',
    google_id VARCHAR(255) UNIQUE,
    constituency VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    language VARCHAR(50) DEFAULT 'en',
    media_url TEXT,
    media_type VARCHAR(50),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    address TEXT,
    constituency VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sentiment VARCHAR(50),
    translated_text TEXT,
    ai_tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demographics (
    id SERIAL PRIMARY KEY,
    constituency VARCHAR(255) UNIQUE NOT NULL,
    population INTEGER NOT NULL,
    literacy_rate NUMERIC(5,2),
    primary_occupation VARCHAR(100),
    avg_income_level VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS infrastructure_gaps (
    id SERIAL PRIMARY KEY,
    constituency VARCHAR(255) NOT NULL,
    gap_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    location_address TEXT,
    metric_gap_details TEXT
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    constituency VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority_score INTEGER NOT NULL,
    estimated_cost NUMERIC(15,2),
    rationale TEXT NOT NULL,
    supporting_suggestions_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'proposed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS constituency_news (
    id SERIAL PRIMARY KEY,
    constituency VARCHAR(255) NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    source_name VARCHAR(255),
    source_url TEXT NOT NULL,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    sentiment VARCHAR(50),
    ai_tags JSONB,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_url, constituency)
);

CREATE INDEX IF NOT EXISTS idx_news_constituency ON constituency_news(constituency);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON constituency_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON constituency_news(category);
CREATE INDEX IF NOT EXISTS idx_suggestions_constituency ON suggestions(constituency);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
`;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const DEMOGRAPHICS_SEED = [
  { constituency: 'Varanasi',          population: 1800000, literacy_rate: 74.50, primary_occupation: 'Trade & Commerce',   avg_income_level: 'Middle' },
  { constituency: 'Lucknow',           population: 2900000, literacy_rate: 79.80, primary_occupation: 'Government Service', avg_income_level: 'Middle' },
  { constituency: 'New Delhi',         population: 1650000, literacy_rate: 88.70, primary_occupation: 'Services & IT',      avg_income_level: 'High'   },
  { constituency: 'Mumbai North',      population: 2400000, literacy_rate: 86.30, primary_occupation: 'Business & Finance', avg_income_level: 'High'   },
  { constituency: 'Bengaluru Central', population: 2200000, literacy_rate: 89.10, primary_occupation: 'IT & Technology',    avg_income_level: 'High'   },
];

const INFRASTRUCTURE_GAPS_SEED = [
  // Varanasi
  { constituency: 'Varanasi',          gap_type: 'Roads',       severity: 'High',   description: 'Over 40% of inner-city lanes remain unpaved, causing waterlogging during monsoon.',         location_address: 'Godaulia & Dashashwamedh Ghat area',       metric_gap_details: 'Approx. 120 km of roads need resurfacing; 18 major potholes reported monthly.' },
  { constituency: 'Varanasi',          gap_type: 'Sanitation',  severity: 'High',   description: 'Open defecation still prevalent in riverside ghats and peri-urban wards.',                  location_address: 'Rajghat, Assi Ghat periphery',             metric_gap_details: '32% households lack individual toilet access; 8 sewage pumping stations non-functional.' },
  { constituency: 'Varanasi',          gap_type: 'Water',       severity: 'Medium', description: 'Intermittent piped water supply — residents receive water for only 3-4 hours per day.',    location_address: 'Bhelupur, Sigra residential areas',        metric_gap_details: 'Water available 3.5 hrs/day on average; 14% households rely on hand-pumps.' },
  // Lucknow
  { constituency: 'Lucknow',           gap_type: 'Electricity', severity: 'Medium', description: 'Frequent load-shedding of 4-6 hours daily in outer wards due to aging substations.',       location_address: 'Aliganj, Indira Nagar, Gomti Nagar East', metric_gap_details: '6 overloaded substations; transformer failure rate 22% higher than state average.' },
  { constituency: 'Lucknow',           gap_type: 'Health',      severity: 'High',   description: 'PHC doctor vacancy rate at 38%; patients travel 15+ km to district hospital.',             location_address: 'Chinhat, Bakshi Ka Talab blocks',          metric_gap_details: '9 of 14 PHCs understaffed; 1 doctor per 6,800 patients vs. norm of 1:1000.' },
  { constituency: 'Lucknow',           gap_type: 'Education',   severity: 'Medium', description: 'Government school dropout rate at 21% in classes 9-10 due to lack of transport & toilets.', location_address: 'Mohanlalganj, Kakori rural areas',          metric_gap_details: '28 schools lack functional toilets; 11 schools have single-teacher classrooms.' },
  // New Delhi
  { constituency: 'New Delhi',         gap_type: 'Roads',       severity: 'Medium', description: 'Signal-free corridors project incomplete; bottlenecks cause 45-minute peak-hour delays.',  location_address: 'Connaught Place to Sarojini Nagar stretch', metric_gap_details: 'Average speed drops to 8 km/h at 3 key intersections during peak hours.' },
  { constituency: 'New Delhi',         gap_type: 'Sanitation',  severity: 'Low',    description: 'Legacy sewer lines in colonial-era localities prone to blockages and overflow.',            location_address: 'Gole Market, Karol Bagh areas',            metric_gap_details: '47 km of sewer lines over 70 years old; 12 overflow incidents in past year.' },
  { constituency: 'New Delhi',         gap_type: 'Water',       severity: 'Medium', description: 'Ground water depletion critical; borewells in unauthorized colonies drying up.',           location_address: 'Malviya Nagar, Mehrauli areas',            metric_gap_details: 'Water table fell 4.2 metres in 5 years; 18,000 households on emergency tankers.' },
  // Mumbai North
  { constituency: 'Mumbai North',      gap_type: 'Roads',       severity: 'High',   description: 'Pothole density among highest in city; 500+ potholes reported annually on arterial roads.', location_address: 'Borivali East, Kandivali Link Road',        metric_gap_details: '512 potholes recorded in FY 2023-24; 3 fatalities attributed to road conditions.' },
  { constituency: 'Mumbai North',      gap_type: 'Water',       severity: 'High',   description: 'Leakage in aging water mains causes 28% distribution loss before reaching households.',   location_address: 'Dahisar, Mira Road supply lines',          metric_gap_details: '28% non-revenue water; 65 km of mains need replacement.' },
  { constituency: 'Mumbai North',      gap_type: 'Education',   severity: 'Medium', description: 'Overcrowded municipal schools with student-to-classroom ratio of 68:1 in slum pockets.',  location_address: 'Malad West, Kurar Village area',           metric_gap_details: '14 schools exceed 60 students/class; 5 schools run double shifts.' },
  // Bengaluru Central
  { constituency: 'Bengaluru Central', gap_type: 'Roads',       severity: 'High',   description: 'Rapid urbanization has overwhelmed arterial roads; flyover completion delayed by 3 years.', location_address: 'Shivajinagar, KR Circle junction',          metric_gap_details: 'Traffic volume 2.4x road capacity; average commute up 35% since 2020.' },
  { constituency: 'Bengaluru Central', gap_type: 'Electricity', severity: 'Low',    description: 'Transformer overloading in CBD causes unplanned outages affecting IT companies.',          location_address: 'MG Road, Brigade Road commercial zone',    metric_gap_details: '7 unplanned outages per month avg.; economic loss estimated ₹4.2 Cr/incident.' },
  { constituency: 'Bengaluru Central', gap_type: 'Sanitation',  severity: 'Medium', description: 'Storm water drains encroached and blocked, leading to flash flooding during rains.',      location_address: 'Shivajinagar, Vasanth Nagar low-lying areas', metric_gap_details: '18 km of SWD encroached; 3 major flooding events in 2023 monsoon.' },
];

const SUGGESTIONS_SEED = [
  // Varanasi
  { title: 'Fix the broken road near Godaulia Chowk',        description: 'Godaulia Chowk ke paas ki sadak bahut kharab hai. Baarish mein paani bhar jaata hai aur log gir jaate hain. Kripya jaldi se thik karein.',   category: 'Roads',       language: 'hi', constituency: 'Varanasi',          sentiment: 'Negative', status: 'pending' },
  { title: 'Public toilet needed at Dashashwamedh Ghat',     description: 'Dashashwamedh Ghat par har roz hazaron tourists aate hain magar koi sahi public toilet nahi hai. Yeh bahut sharmnaak sthiti hai.',             category: 'Sanitation',  language: 'hi', constituency: 'Varanasi',          sentiment: 'Negative', status: 'pending' },
  { title: 'Water supply disruption in Sigra area',          description: 'Sigra area mein pichhle 2 mahine se paani sirf 2 ghante milta hai. Ghar ka kaam karna mushkil ho gaya hai. Tanks se paani khareedna padta hai.', category: 'Water',       language: 'hi', constituency: 'Varanasi',          sentiment: 'Negative', status: 'pending' },
  { title: 'Street lights not working in Bhelupur',          description: 'Bhelupur main road par 15 street lights kharab hain. Raat ko bahut andhera rehta hai, mahilaon ko dar lagta hai. Police report bhi de chuke hain.', category: 'Electricity', language: 'hi', constituency: 'Varanasi',          sentiment: 'Negative', status: 'pending' },
  // Lucknow
  { title: 'Demand for new health sub-centre in Chinhat',    description: 'Chinhat block mein nearest PHC 12 km door hai. Emergency mein patients ki halat kharab ho jaati hai. Ek sub-centre yahan bahut zaroori hai.',   category: 'Health',      language: 'hi', constituency: 'Lucknow',           sentiment: 'Negative', status: 'pending' },
  { title: 'Road repair needed on Aliganj main road',        description: 'Aliganj ki main road par potholes itne bade hain ke 2-wheelers palat jaate hain. 3 accidents is mahine ho chuke hain. Ati shighra sudhaar chahiye.', category: 'Roads',       language: 'hi', constituency: 'Lucknow',           sentiment: 'Negative', status: 'pending' },
  { title: 'Upgrade schools in Mohanlalganj area',           description: 'Government school in Mohanlalganj has 3 teachers for 8 classes. Students in class 8 cannot read properly. We need trained teachers urgently.',   category: 'Education',   language: 'en', constituency: 'Lucknow',           sentiment: 'Negative', status: 'pending' },
  { title: 'Electricity load shedding causing business loss', description: '6 hours of daily load shedding in Indira Nagar is ruining small businesses. My bakery lost ₹40,000 last month due to freezer failures.',         category: 'Electricity', language: 'en', constituency: 'Lucknow',           sentiment: 'Negative', status: 'pending' },
  // New Delhi
  { title: 'Pothole hazard at Connaught Place roundabout',   description: 'Large pothole near CP inner circle has caused 4 accidents this month. Please repair before monsoon makes it worse. CCTV footage available.',     category: 'Roads',       language: 'en', constituency: 'New Delhi',         sentiment: 'Negative', status: 'pending' },
  { title: 'Groundwater crisis in Malviya Nagar',            description: 'Our borewell has completely dried up. We are buying water at ₹800 per tanker, thrice a week. This is unsustainable. Need pipeline connection.', category: 'Water',       language: 'en', constituency: 'New Delhi',         sentiment: 'Negative', status: 'pending' },
  { title: 'Sewer overflow in Karol Bagh market',            description: 'Old sewer line overflowing near Karol Bagh market every monsoon. Shopkeepers suffering huge losses. Same problem for past 5 years, no action.',  category: 'Sanitation',  language: 'en', constituency: 'New Delhi',         sentiment: 'Negative', status: 'pending' },
  { title: 'Appreciation for new cycle tracks on Ring Road',  description: 'The new cycle tracks on Ring Road are excellent! Safe, well-lit, and properly marked. More of this across the constituency please!',             category: 'Roads',       language: 'en', constituency: 'New Delhi',         sentiment: 'Positive', status: 'pending' },
  // Mumbai North
  { title: 'Kandivali link road full of potholes',           description: 'Kandivali Link Road has turned into a dirt track. Two-wheelers fall daily. The contractor did substandard work. Need re-tendering of contract.',  category: 'Roads',       language: 'en', constituency: 'Mumbai North',      sentiment: 'Negative', status: 'pending' },
  { title: 'Water leakage on Dahisar main supply line',      description: 'A major water main in Dahisar has been leaking for 3 weeks. Thousands of litres wasted daily. Footpath is flooded and muddy. No action so far.',  category: 'Water',       language: 'en', constituency: 'Mumbai North',      sentiment: 'Negative', status: 'pending' },
  { title: 'Overcrowded classrooms in Malad municipal school', description: 'My child studies in a class of 72 students with one teacher. They cannot get individual attention. Need another section or more teachers urgently.', category: 'Education',   language: 'en', constituency: 'Mumbai North',      sentiment: 'Negative', status: 'pending' },
  // Bengaluru Central
  { title: 'Shivajinagar flyover construction update needed', description: 'The flyover construction at Shivajinagar has been going on for 5 years. No clarity on completion date. Daily traffic jams waste 2 hours of my day.', category: 'Roads',       language: 'en', constituency: 'Bengaluru Central', sentiment: 'Negative', status: 'pending' },
  { title: 'Storm drain blocked near Vasanth Nagar',         description: 'The storm drain on Vasanth Nagar cross-road is completely blocked with debris. Last monsoon, 3 feet of water entered homes. Desperate for action.', category: 'Sanitation',  language: 'en', constituency: 'Bengaluru Central', sentiment: 'Negative', status: 'pending' },
  { title: 'Power outages hurting IT companies on MG Road',  description: 'Frequent unplanned power cuts on MG Road are disrupting IT operations. Generators cost us ₹2L/month. BESCOM must fix transformer immediately.',    category: 'Electricity', language: 'en', constituency: 'Bengaluru Central', sentiment: 'Negative', status: 'pending' },
  { title: 'Great response after metro expansion',           description: 'The metro expansion to Nagavara has significantly reduced my commute. This is a great initiative. Please extend to Hennur Road next.',             category: 'Roads',       language: 'en', constituency: 'Bengaluru Central', sentiment: 'Positive', status: 'pending' },
];

// ---------------------------------------------------------------------------
// initializeDatabase
// ---------------------------------------------------------------------------
async function initializeDatabase() {
  console.log('[DB] Running schema migrations...');
  try {
    await pool.query(CREATE_TABLES_SQL);
    console.log('[DB] Schema ready.');
  } catch (err) {
    console.error('[DB] Schema migration failed:', err.message);
    throw err;
  }

  // ---- Seed demographics ----
  try {
    const { rows: existingDemographics } = await pool.query('SELECT COUNT(*) AS cnt FROM demographics');
    if (parseInt(existingDemographics[0].cnt, 10) === 0) {
      console.log('[DB] Seeding demographics...');
      for (const d of DEMOGRAPHICS_SEED) {
        await pool.query(
          `INSERT INTO demographics (constituency, population, literacy_rate, primary_occupation, avg_income_level)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (constituency) DO NOTHING`,
          [d.constituency, d.population, d.literacy_rate, d.primary_occupation, d.avg_income_level]
        );
      }
      console.log(`[DB] Seeded ${DEMOGRAPHICS_SEED.length} constituencies into demographics.`);
    }
  } catch (err) {
    console.error('[DB] Demographics seed error:', err.message);
  }

  // ---- Seed infrastructure gaps ----
  try {
    const { rows: existingGaps } = await pool.query('SELECT COUNT(*) AS cnt FROM infrastructure_gaps');
    if (parseInt(existingGaps[0].cnt, 10) === 0) {
      console.log('[DB] Seeding infrastructure_gaps...');
      for (const g of INFRASTRUCTURE_GAPS_SEED) {
        await pool.query(
          `INSERT INTO infrastructure_gaps (constituency, gap_type, description, severity, location_address, metric_gap_details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [g.constituency, g.gap_type, g.description, g.severity, g.location_address, g.metric_gap_details]
        );
      }
      console.log(`[DB] Seeded ${INFRASTRUCTURE_GAPS_SEED.length} infrastructure gaps.`);
    }
  } catch (err) {
    console.error('[DB] Infrastructure gaps seed error:', err.message);
  }

  // ---- Seed settings ----
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('active_model', $1)
       ON CONFLICT (key) DO NOTHING`,
      [process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash']
    );
    console.log('[DB] Default settings ensured.');
  } catch (err) {
    console.error('[DB] Settings seed error:', err.message);
  }

  // ---- Seed suggestions ----
  try {
    const { rows: existingSugg } = await pool.query('SELECT COUNT(*) AS cnt FROM suggestions');
    if (parseInt(existingSugg[0].cnt, 10) === 0) {
      console.log('[DB] Seeding suggestions...');
      for (const s of SUGGESTIONS_SEED) {
        await pool.query(
          `INSERT INTO suggestions (title, description, category, language, constituency, status, sentiment)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [s.title, s.description, s.category, s.language, s.constituency, s.status, s.sentiment]
        );
      }
      console.log(`[DB] Seeded ${SUGGESTIONS_SEED.length} suggestions.`);
    }
  } catch (err) {
    console.error('[DB] Suggestions seed error:', err.message);
  }

  console.log('[DB] initializeDatabase complete.');
}

module.exports = { pool, query, initializeDatabase };
