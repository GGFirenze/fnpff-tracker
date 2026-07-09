import { getDb, authCheck, unauthorized } from './_db.js'

const SEED_SQL = `
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  classification TEXT NOT NULL,
  fressnapf_status TEXT NOT NULL DEFAULT 'Open',
  amplitude_status TEXT NOT NULL DEFAULT 'Unprocessed',
  zendesk_ticket_id TEXT,
  zendesk_url TEXT,
  productboard_note_id TEXT,
  productboard_url TEXT,
  productboard_status TEXT NOT NULL DEFAULT 'Not Logged',
  pm_owner TEXT NOT NULL DEFAULT 'None',
  pillar TEXT NOT NULL,
  reporter TEXT NOT NULL,
  created_date TEXT,
  last_updated TEXT DEFAULT (datetime('now')),
  notes TEXT,
  engineering_ref TEXT
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER REFERENCES tickets(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL DEFAULT 'amplitude',
  changed_at TEXT DEFAULT (datetime('now'))
);
`

const ZD = (id) => `https://amplitude.zendesk.com/agent/tickets/${id}`

// Consolidated Fressnapf FR & bug list — "Fressnapf_Requests_and_Bugs" (09 Jul 2026).
// Part 1 = Feature Requests (FR), Part 2 = Bugs. Pillar is best-fit to the three
// allowed values; the exact pillar/eng Slack channel is preserved in notes.
const SEED_DATA = [
  // --- Part 1: Feature Requests ---
  [1, 'Count Items & Count Events on Data Table Total Counts', 'When grouping by cart properties, let Event Totals offer both selectable measures (like Segmentation) for order-level vs item-level analysis.', 'FR', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Liping Yin (for Kateryna Osypova)', '2026-07-09', 'Channel: #pillar-analytics (Submit Pillar Feedback). FE concept built (Dan Carmel); wiring in progress (Brian Cooper); Liping confirming with customer.', 'QRY-550'],
  [2, 'Copy channel classifiers / definitions across projects', 'Copy channel classifiers / definitions across projects to avoid manual recreation.', 'FR', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Liping Yin', '2026-07-09', 'Channel: #marketing-analytics. Previously existed, then disabled; workaround = copy rows.', 'AMP-65915'],
  [3, 'Data Assistant Agent: rollback + cross-project taxonomy sync', 'Data Assistant Agent rollback plus cross-project taxonomy sync (master to country propagation).', 'FR', 'Open', 'On Hold', '400111', ZD('400111'), null, null, 'Not Logged', 'None', 'Data Management', 'Liping Yin', '2026-07-09', 'Channel: #pillar-agents. Not supported today; folded into cross-project propagation planning.', null],
  [4, 'Enable array (cart) splitting via Taxonomy API', 'Enable array (cart) splitting via the Taxonomy API — currently UI-only after is_array_type=true.', 'FR', 'Open', 'Unprocessed', '372093', ZD('372093'), null, null, 'Unprocessed', 'None', 'Governance', 'Florian Götting / Liping Yin', '2026-07-09', 'Channel: #product-feedback. Logged as a Productboard note.', null],
  [5, 'API to get/set channel information for multi-project automation', 'API to retrieve and set channel information for multi-project automation.', 'FR', 'Open', 'Unprocessed', '383898', ZD('383898'), null, null, 'Unprocessed', 'None', 'Governance', 'Florian Götting / Liping Yin', '2026-07-09', 'Channel: #product-feedback. Logged as a Productboard note.', null],
  [6, 'overrideScope="shared" option on create-event-property endpoint', 'Add an overrideScope="shared" option to the create-event-property endpoint to avoid auto-overrides.', 'FR', 'Open', 'Unprocessed', '372883', ZD('372883'), null, null, 'Unprocessed', 'None', 'Governance', 'Florian Götting / Liping Yin', '2026-07-09', 'Channel: #product-feedback. Logged as a Productboard note.', null],
  [7, 'User-properties API returns deleted properties', 'Fix inconsistency in the user-properties API — stop returning deleted properties (align with the event-properties endpoint).', 'FR', 'Open', 'Unprocessed', '372935', ZD('372935'), null, null, 'Unprocessed', 'None', 'Governance', 'Florian Götting / Jake Lee', '2026-07-09', 'Channel: #product-feedback. Logged as a Productboard note. Also historically tracked as a bug under ZD 372935.', null],
  [8, 'Persisted-property expiration by event', 'Persisted-property expiration by event (e.g. expire after backend_order), not just visit/time-based.', 'FR', 'Open', 'Unprocessed', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Giuliano Giannini', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Added to feedback list; raised multiple times pre-GA.', null],
  [9, 'Show complete / non-pruned results toggle in Data Tables', 'A "show complete / non-pruned results" toggle in Data Tables for business-critical analysis.', 'FR', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Thao Nguyen (on behalf of customer)', '2026-07-09', 'Channel: #pillar-marketer-analytics. Higher-capacity mode discussed; unlimited toggle not planned.', null],
  [10, 'Funnel support for excluding bounced users', 'Funnel support for excluding bounced users (Adobe "non-single page visit" equivalent).', 'FR', 'Open', 'Unprocessed', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Giuliano Giannini', '2026-07-09', 'Channel: #pillar-analytics. Raised as a question; borderline FR, no native support today.', null],
  [11, 'Filter dropdown should show "Direct" for renamed (none) persisted properties', 'Filter dropdown should respect "Rename (none) -> Direct" for persisted properties — show "Direct" (not "(none)") in the filter value list so stakeholders can find it without knowing the underlying mapping.', 'FR', 'Open', 'In Engineering', '400900', ZD('400900'), null, null, 'Unprocessed', 'None', 'Analytics', 'Liping Yin (for Sebastian Damm)', '2026-07-09', 'Channel: #pillar-analytics (Submit Pillar Feedback). Logged; tagged Core Analytics pod (Nive Suresh); customer added follow-up detail 7 Jul.', null],
  // --- Part 2: Bugs ---
  [12, 'Session Totals != Event Totals for order_created by persisted Channel', 'Session Totals do not equal Event Totals for the same order_created grouped by persisted Channel (Direct off by ~14k, validated vs warehouse).', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Root cause: stale cache not invalidated; fix in review.', 'MAR-211'],
  [13, 'Drilldown percentages do not reconcile across metric columns', 'Drilldown percentages do not reconcile across metric columns (sums >100%, cross-metric inconsistency).', 'Bug', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Largely assessed as expected; chart link disputed.', 'MAR-212'],
  [14, 'Rows disappear when metric set changes (silent data loss)', 'Rows disappear when the metric set changes — silent data loss (Share under "mai" vanishes).', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Confirmed bug (null value label); PR raised.', 'MAR-213 / MIW-200'],
  [15, 'Changing one column metric impacts another column in Data Table', 'Changing the metric of one column impacts the results of another column in a Data Table.', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-marketer-analytics. Escalated red; repro difficulty (EU access).', 'CAP-440 / MIW-337'],
  [16, 'Total Events vs Total Sessions group-by Cart properties discrepancy', 'Total Events vs Total Sessions group-by Cart properties discrepancy.', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-marketer-analytics. Escalated red; possibly linked to MIW-236.', 'CAP-448 / QRY-550'],
  [17, '(other) row inflates / breaks split with Platform segmentation on PP table', 'The (other) row inflates / breaks the split when Platform (web/app) segmentation is added to an event-based persisted-property table; refresh no longer fixes it.', 'Bug', 'Fixed', 'Closed', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Root-caused to aggressive nested group-by pruning; quick fix deployed.', 'CAP-396'],
  [18, 'Persisted event-property results do not match user-based for large countries', 'Persisted event-property results do not match user-based results for large countries/global; tables disappear on project switch.', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Logged; low-results issue confirmed still reproducing.', 'CAB-744'],
  [19, 'Dashboards take up to 10 min to load (persisted + derived props)', 'Dashboards take up to 10 minutes to load (persisted + derived props + group-by).', 'Bug', 'Open', 'In Engineering', '400944', ZD('400944'), null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-query. Temp fix deployed, cache extended; concurrent PP queries limited.', null],
  [20, 'Data Table pruning warning shown on simple tables (misleading banner)', 'The Data Table pruning warning shows on simple tables where no rows are pruned (misleading banner).', 'Bug', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-marketer-analytics. Deemed working as expected; treated as a UX improvement, not a bug.', 'MAR-391'],
  [21, 'Partial rows shown in Data Table (investigation)', 'Partial rows shown in a Data Table — under investigation.', 'Bug', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-marketer-analytics / #marketing-analytics. Recovered on its own; root-cause investigation requested.', 'CAP-518'],
  [22, 'Group-by returns (none) for a combo that previously worked (possible regression)', 'Group-by returns (none) for a metric+group-by combo that previously worked — possible regression.', 'Bug', 'Fixed', 'Closed', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #session-everywhere. Session ticket. Investigated; cache-related, resolved via a hybrid formula metric.', null],
  [23, 'Sessions in table do not add up (group-by higher than total)', 'Sessions in a table do not add up — group-by higher than the total; two channels shown as "last property value".', 'Bug', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Guy Sharon', '2026-07-09', 'Channel: #session-everywhere. Raised from a Fressnapf call; later unsure it reproduced.', null],
  [24, 'Chart segment labels cannot be changed / show random group-by value', 'Chart segment labels cannot be changed / show a random group-by value ("app; SEO" vs "app"); no custom label.', 'Bug', 'Open', 'In Engineering', null, null, null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #pillar-analytics. Tracked in Glean/Linear. Logged; Core Analytics ticket created (bug vs FR TBD).', null],
  [25, 'Cart properties drilldown error — "Invalid cart properties used unexpectedly"', 'Cart properties drilldown error — "Invalid cart properties used unexpectedly"; no undo/remove (must reload).', 'Bug', 'Open', 'On Hold', null, null, null, null, 'Not Logged', 'None', 'Analytics', 'Jiayi / Curtis', '2026-07-09', 'Channel: #analytics-persisted-properties-merchandising. Flagged possibly known; empty-state revert fix suggested.', null],
  [26, 'Pruning / "server too busy" message creating stakeholder friction (JL top priority)', 'Pruning / "server too busy" message on screen creating stakeholder friction — Jose Luis top priority.', 'Bug', 'Open', 'In Engineering', '401199', ZD('401199'), null, null, 'Not Logged', 'None', 'Analytics', '', '2026-07-09', 'Channel: #ZC Fressnapf channel. #399666 resolved; #401199 flagged top priority.', null],
]

export default async function handler(req, res) {
  if (!authCheck(req)) return unauthorized(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let db
  try {
    db = getDb()
  } catch (error) {
    return res.status(500).json({ error: `DB init failed: ${error.message}` })
  }

  try {
    await db.executeMultiple(SEED_SQL)

    for (const row of SEED_DATA) {
      await db.execute({
        sql: `INSERT INTO tickets (id, topic, summary, classification, fressnapf_status, amplitude_status, zendesk_ticket_id, zendesk_url, productboard_note_id, productboard_url, productboard_status, pm_owner, pillar, reporter, created_date, notes, engineering_ref)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: row,
      })
    }

    return res.status(201).json({ message: 'Database seeded successfully', count: SEED_DATA.length })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
