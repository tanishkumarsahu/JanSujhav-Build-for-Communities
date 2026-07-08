'use strict';

/**
 * Structural data seed for the demand-scoring engine.
 * 
 * This is the "external dataset integration layer" —
 * seeded from publicly available patterns in UDISE+, MoLE, and MORTH data.
 * A real pipeline would ingest these from state education/transport APIs;
 * this demo uses a seeded sample of ~20 proposals across 3 categories.
 * 
 * Data fields are category-specific (the core architectural point):
 *   - school_upgrade: enrollment/capacity + nearest alternate school distance
 *   - vocational_centre: youth unemployment + nearest centre + industry demand
 *   - road_repair: traffic volume/accident count + ward connectivity
 */

const STRUCTURAL_DATA = {

  // ─── School Upgrades ─────────────────────────────────────────────────────────
  school_upgrade: [
    {
      proposal_id: 'SCH-VNS-001',
      constituency: 'Varanasi',
      ward_id: 'VNS-W12',
      location: { lat: 25.3176, lng: 82.9739, area: 'Godaulia Ward' },
      school_name: 'Govt. Primary School No. 142, Godaulia',
      enrollment: 487,
      sanctioned_capacity: 320,
      // enrollment/capacity = 1.52 → 152% — highly overcrowded
      nearest_alt_school_km: 3.8,
      // Data note: UDISE+ 2022-23 shows avg enrollment in Varanasi wards at 140% capacity
      first_reported_date: '2025-09-15',
      citizen_context: 'Parents complain children study in hallways; no separate girls toilet.',
    },
    {
      proposal_id: 'SCH-VNS-002',
      constituency: 'Varanasi',
      ward_id: 'VNS-W07',
      location: { lat: 25.2890, lng: 82.9632, area: 'Bhelupur Ward' },
      school_name: 'Govt. Upper Primary School, Sigra',
      enrollment: 310,
      sanctioned_capacity: 280,
      nearest_alt_school_km: 2.1,
      first_reported_date: '2025-11-02',
      citizen_context: 'Single-teacher school for classes 1-8; dropout rate rising.',
    },
    {
      proposal_id: 'SCH-LKO-001',
      constituency: 'Lucknow',
      ward_id: 'LKO-W23',
      location: { lat: 26.8951, lng: 81.0198, area: 'Mohanlalganj Block' },
      school_name: 'Govt. Composite School, Kakori Road',
      enrollment: 612,
      sanctioned_capacity: 400,
      // 153% capacity — worst in Lucknow cluster
      nearest_alt_school_km: 7.2,
      first_reported_date: '2025-08-20',
      citizen_context: 'Double-shift running; evening batch has no electricity.',
    },
    {
      proposal_id: 'SCH-MUM-001',
      constituency: 'Mumbai North',
      ward_id: 'MUM-W41',
      location: { lat: 19.1901, lng: 72.8488, area: 'Malad West, Kurar Village' },
      school_name: 'BMC School No. 4, Kurar Village',
      enrollment: 890,
      sanctioned_capacity: 600,
      // 148% capacity — consistent with BMC data showing 60+ students/class
      nearest_alt_school_km: 1.4,
      first_reported_date: '2025-10-05',
      citizen_context: '72 students per classroom; 3 classrooms share one blackboard.',
    },
    {
      proposal_id: 'SCH-BLR-001',
      constituency: 'Bengaluru Central',
      ward_id: 'BLR-W08',
      location: { lat: 12.9769, lng: 77.5993, area: 'Shivajinagar' },
      school_name: 'BBMP Govt. Higher Primary School, Shivajinagar',
      enrollment: 340,
      sanctioned_capacity: 300,
      nearest_alt_school_km: 0.8,
      first_reported_date: '2025-12-01',
      citizen_context: 'Building structurally unsafe; roof leaked last monsoon.',
    },
  ],

  // ─── Vocational Centres ───────────────────────────────────────────────────────
  vocational_centre: [
    {
      proposal_id: 'VOC-LKO-001',
      constituency: 'Lucknow',
      ward_id: 'LKO-W31',
      location: { lat: 26.8467, lng: 80.9462, area: 'Chinhat Block' },
      // Youth unemployment: 18-25 year olds NEET in block
      youth_unemployment_rate: 28.4, // percent
      // Nearest existing ITI/vocational centre
      nearest_centre_km: 14.2,
      // Local industry demand: jobs open within 15km in target trades
      local_industry_demand_score: 72, // 0-100 index: logistics + garment manufacturing
      target_population_18_25: 18400,
      industry_context: 'Chinhat industrial area has 40+ MSME garment units with unfilled skilled roles.',
      first_reported_date: '2025-07-10',
    },
    {
      proposal_id: 'VOC-VNS-001',
      constituency: 'Varanasi',
      ward_id: 'VNS-W18',
      location: { lat: 25.3456, lng: 82.9876, area: 'Banaras Weaving Cluster' },
      youth_unemployment_rate: 34.1,
      nearest_centre_km: 9.8,
      local_industry_demand_score: 88, // silk weaving, craft export
      target_population_18_25: 12600,
      industry_context: 'Banarasi silk industry employs 200k+ but lacks trained designers/CAD operators.',
      first_reported_date: '2025-09-01',
    },
    {
      proposal_id: 'VOC-MUM-001',
      constituency: 'Mumbai North',
      ward_id: 'MUM-W22',
      location: { lat: 19.2480, lng: 72.8597, area: 'Dahisar' },
      youth_unemployment_rate: 19.6,
      nearest_centre_km: 5.1,
      local_industry_demand_score: 61,
      target_population_18_25: 24800,
      industry_context: 'Construction boom in Mira-Bhayander corridor needs electricians, plumbers.',
      first_reported_date: '2025-10-22',
    },
    {
      proposal_id: 'VOC-DEL-001',
      constituency: 'New Delhi',
      ward_id: 'DEL-W15',
      location: { lat: 28.6139, lng: 77.2090, area: 'Karol Bagh' },
      youth_unemployment_rate: 14.2,
      nearest_centre_km: 2.3,
      local_industry_demand_score: 45, // lower: high competition from existing private institutes
      target_population_18_25: 9200,
      industry_context: 'Retail and hospitality sector demand exists but private institutes already active.',
      first_reported_date: '2025-11-15',
    },
    {
      proposal_id: 'VOC-BLR-001',
      constituency: 'Bengaluru Central',
      ward_id: 'BLR-W19',
      location: { lat: 12.9900, lng: 77.6101, area: 'KR Puram' },
      youth_unemployment_rate: 11.8,
      nearest_centre_km: 3.4,
      local_industry_demand_score: 79, // IT support, data entry, digital skills
      target_population_18_25: 31200,
      industry_context: 'IT corridor demand for 10th-pass BPO/coding roles; no public ITI covers this.',
      first_reported_date: '2025-08-05',
    },
  ],

  // ─── Road Repairs ─────────────────────────────────────────────────────────────
  road_repair: [
    {
      proposal_id: 'RD-VNS-001',
      constituency: 'Varanasi',
      ward_id: 'VNS-W03',
      location: { lat: 25.3120, lng: 82.9740, area: 'Godaulia Chowk' },
      road_name: 'Godaulia Main Road (0.8km stretch)',
      daily_traffic_volume: 18500, // vehicles/day
      accident_count_12mo: 14,
      road_length_km: 0.8,
      // How many wards does repairing this road benefit (connectivity)
      wards_connected: 6,
      surface_condition_score: 18, // 0-100 (lower = worse)
      first_reported_date: '2025-06-01',
      citizen_context: '14 accidents in 12 months; 3 fatalities; ambulances avoid this stretch.',
    },
    {
      proposal_id: 'RD-LKO-001',
      constituency: 'Lucknow',
      ward_id: 'LKO-W09',
      location: { lat: 26.8993, lng: 81.0256, area: 'Aliganj Main Road' },
      road_name: 'Aliganj-Indira Nagar Connector (2.1km)',
      daily_traffic_volume: 32000,
      accident_count_12mo: 9,
      road_length_km: 2.1,
      wards_connected: 9,
      surface_condition_score: 32,
      first_reported_date: '2025-07-18',
      citizen_context: '2-wheelers falling daily; school children at high risk on school route.',
    },
    {
      proposal_id: 'RD-DEL-001',
      constituency: 'New Delhi',
      ward_id: 'DEL-W04',
      location: { lat: 28.6330, lng: 77.2180, area: 'Connaught Place roundabout' },
      road_name: 'Inner Circle CP — Sansad Marg junction (0.4km)',
      daily_traffic_volume: 55000,
      accident_count_12mo: 4,
      road_length_km: 0.4,
      wards_connected: 12,
      surface_condition_score: 55,
      first_reported_date: '2025-10-01',
      citizen_context: 'Large pothole causing 4 accidents; high-visibility area near Parliament.',
    },
    {
      proposal_id: 'RD-MUM-001',
      constituency: 'Mumbai North',
      ward_id: 'MUM-W33',
      location: { lat: 19.2066, lng: 72.8672, area: 'Kandivali Link Road' },
      road_name: 'Kandivali Link Road (3.4km)',
      daily_traffic_volume: 41000,
      accident_count_12mo: 22,
      road_length_km: 3.4,
      wards_connected: 7,
      surface_condition_score: 12, // worst score — 512 potholes
      first_reported_date: '2025-05-12',
      citizen_context: '512 potholes; 3 fatalities; contractor blacklisted; re-tendering needed.',
    },
    {
      proposal_id: 'RD-BLR-001',
      constituency: 'Bengaluru Central',
      ward_id: 'BLR-W02',
      location: { lat: 12.9900, lng: 77.5942, area: 'Shivajinagar flyover approach' },
      road_name: 'Shivajinagar–KR Circle approach road (1.6km)',
      daily_traffic_volume: 68000,
      accident_count_12mo: 7,
      road_length_km: 1.6,
      wards_connected: 15,
      surface_condition_score: 28,
      first_reported_date: '2025-04-30',
      citizen_context: 'Flyover construction zone; no proper bypass; 2x traffic density vs capacity.',
    },
  ],
};

/**
 * Citizen signal seed data.
 * In production this is aggregated from the `suggestions` table dynamically.
 * For the demo, we seed a representative count + severity per proposal.
 */
const CITIZEN_SIGNALS = {
  // school_upgrade
  'SCH-VNS-001': { complaint_count: 38, avg_severity: 4.3, unique_submitters: 29, first_reported_date: '2025-09-15' },
  'SCH-VNS-002': { complaint_count: 14, avg_severity: 3.6, unique_submitters: 12, first_reported_date: '2025-11-02' },
  'SCH-LKO-001': { complaint_count: 52, avg_severity: 4.5, unique_submitters: 41, first_reported_date: '2025-08-20' },
  'SCH-MUM-001': { complaint_count: 67, avg_severity: 4.1, unique_submitters: 55, first_reported_date: '2025-10-05' },
  'SCH-BLR-001': { complaint_count: 21, avg_severity: 3.9, unique_submitters: 18, first_reported_date: '2025-12-01' },
  // vocational_centre
  'VOC-LKO-001': { complaint_count: 19, avg_severity: 3.4, unique_submitters: 16, first_reported_date: '2025-07-10' },
  'VOC-VNS-001': { complaint_count: 31, avg_severity: 4.0, unique_submitters: 27, first_reported_date: '2025-09-01' },
  'VOC-MUM-001': { complaint_count: 12, avg_severity: 3.1, unique_submitters: 10, first_reported_date: '2025-10-22' },
  'VOC-DEL-001': { complaint_count: 8,  avg_severity: 2.8, unique_submitters: 7,  first_reported_date: '2025-11-15' },
  'VOC-BLR-001': { complaint_count: 44, avg_severity: 3.7, unique_submitters: 38, first_reported_date: '2025-08-05' },
  // road_repair
  'RD-VNS-001':  { complaint_count: 61, avg_severity: 4.8, unique_submitters: 49, first_reported_date: '2025-06-01' },
  'RD-LKO-001':  { complaint_count: 47, avg_severity: 4.6, unique_submitters: 39, first_reported_date: '2025-07-18' },
  'RD-DEL-001':  { complaint_count: 28, avg_severity: 4.2, unique_submitters: 24, first_reported_date: '2025-10-01' },
  'RD-MUM-001':  { complaint_count: 89, avg_severity: 4.9, unique_submitters: 72, first_reported_date: '2025-05-12' },
  'RD-BLR-001':  { complaint_count: 55, avg_severity: 4.4, unique_submitters: 46, first_reported_date: '2025-04-30' },
};

module.exports = { STRUCTURAL_DATA, CITIZEN_SIGNALS };
