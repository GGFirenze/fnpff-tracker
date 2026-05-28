import { getDb, authCheck, unauthorized } from './_db.js'

const SEED_SQL = `
CREATE TABLE IF NOT EXISTS tickets (
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

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER REFERENCES tickets(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL DEFAULT 'amplitude',
  changed_at TEXT DEFAULT (datetime('now'))
);
`

const SEED_DATA = [
  [1, 'Deleted user props returned in GET endpoint', 'GET user properties API still returns properties that have been deleted. Known bug, not prioritised.', 'Bug', 'Open', 'Closed', '372935', 'https://help.amplitude.com/hc/en-us/requests/372935', '51713875', 'https://app.productboard.com/notes/51713875', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2024-11-15', 'Known bug confirmed by engineering. Not on current roadmap. AMP-148857 in backlog.', 'AMP-148857'],
  [2, 'Nested array splitting not supported', 'Taxonomy API does not support splitting nested arrays — product limitation.', 'Product limitation', 'Open', 'Closed', '373624', 'https://help.amplitude.com/hc/en-us/requests/373624', '51448847', 'https://app.productboard.com/notes/51448847', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2024-11-20', 'Fundamental architecture limitation. Would require significant rework of ingestion pipeline.', null],
  [3, 'Channel definitions API', 'New API for channel definitions — shipped and resolved.', 'FR', 'Fixed', 'Resolved', '383898', 'https://help.amplitude.com/hc/en-us/requests/383898', '53211010', 'https://app.productboard.com/notes/53211010', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2025-02-10', 'Resolved. New API shipped Q1 2025.', null],
  [4, 'Array item type update via Taxonomy API', 'Could not update array item types via Taxonomy API — fixed.', 'Bug', 'Fixed', 'Resolved', '384416', 'https://help.amplitude.com/hc/en-us/requests/384416', null, null, 'Not Logged', 'None', 'Governance', 'Florian Götting', '2025-02-15', 'Bug fix deployed. Confirmed working by Fressnapf.', null],
  [5, 'User property display name via Taxonomy API', 'Cannot set display_name for user properties through the Taxonomy API.', 'FR', 'Open', 'Closed', '384417', 'https://help.amplitude.com/hc/en-us/requests/384417', '53390704', 'https://app.productboard.com/notes/53390704', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2025-02-15', 'Feature request logged but unprocessed. No PM assigned.', null],
  [6, 'OOTB metric UI editing', 'Out-of-the-box metrics could not be edited in UI — fixed.', 'Bug', 'Fixed', 'Resolved', '384634', 'https://help.amplitude.com/hc/en-us/requests/384634', null, null, 'Not Logged', 'None', 'Analytics', 'Kateryna Osypova', '2025-02-18', 'UI fix deployed.', null],
  [7, 'Event display_name API', 'GET event type API was not returning the display_name field — fixed.', 'Bug', 'Fixed', 'Resolved', '386375', 'https://help.amplitude.com/hc/en-us/requests/386375', '53763405', 'https://app.productboard.com/notes/53763405', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2025-03-01', 'Fixed. display_name field now returned in API response.', null],
  [8, 'Copy channel definitions across projects', 'No way to copy channel definitions from one project to another. FR + bug in existing copy functionality.', 'FR', 'Open', 'Closed', '384929', 'https://help.amplitude.com/hc/en-us/requests/384929', '54042671', 'https://app.productboard.com/notes/54042671', 'Unprocessed', 'None', 'Governance', 'Florian Götting', '2025-02-20', 'Logged as FR. Existing project copy does not include channel definitions.', null],
  [9, 'OOTB metrics share one Page View definition', 'All out-of-the-box metrics reference a single Page View event definition. Architectural issue prevents per-metric customisation.', 'Product limitation', 'Open', 'On Hold', '388840', 'https://help.amplitude.com/hc/en-us/requests/388840', null, null, 'Not Logged', 'None', 'Analytics', 'Kateryna Osypova', '2025-03-15', 'Architectural constraint. Engineering aware but no planned fix. Not logged in Productboard.', 'AMP-150769'],
  [10, 'Session Replay Agent not finding sessions', 'Session Replay AI agent was not surfacing relevant sessions — fixed.', 'Bug', 'Fixed', 'Resolved', '390732', 'https://help.amplitude.com/hc/en-us/requests/390732', '51399705', 'https://app.productboard.com/notes/51399705', 'Unprocessed', 'None', 'Analytics', 'Sebastian Damm', '2025-04-01', 'Fixed. Note: PB note 51399705 is for overrideScope in create event property, a related but separate issue.', null],
  [11, 'Dynamic Sampling cannot be disabled', 'Dynamic sampling toggle was not working — fixed.', 'Bug', 'Fixed', 'Resolved', '391041', 'https://help.amplitude.com/hc/en-us/requests/391041', null, null, 'Not Logged', 'None', 'Data Management', 'Sebastian Damm', '2025-04-05', 'Bug fix deployed. Sampling can now be disabled.', null],
  [12, 'Lookup Table 1M cumulative row limit', 'Lookup tables have a 1M cumulative row limit across all tables. Fressnapf hitting this limit.', 'Product limitation', 'Open', 'Closed', '391631', 'https://help.amplitude.com/hc/en-us/requests/391631', null, null, 'Not Logged', 'None', 'Data Management', 'Florian Götting', '2025-04-10', 'Product limitation. Generic FR exists from Amazon, Dell, HEB, Mercado Libre, Fandom, Moderna — but no Fressnapf-specific note in PB.', 'AMP-149510'],
  [13, 'Configurable reset/unset value for campaign props', 'Campaign properties cannot be reset or unset with a configurable value.', 'FR', 'Open', 'Closed', '392406', 'https://help.amplitude.com/hc/en-us/requests/392406', '55406553', 'https://app.productboard.com/notes/55406553', 'Unprocessed', 'None', 'Governance', 'Markus Buss', '2025-04-18', 'FR logged. No PM owner assigned.', null],
  [14, 'EU endpoint outage', 'EU data endpoint experienced outage — resolved.', 'Bug', 'Fixed', 'Resolved', '392786', 'https://help.amplitude.com/hc/en-us/requests/392786', null, null, 'Not Logged', 'None', 'Data Management', 'Sebastian Damm', '2025-04-22', 'Infrastructure incident resolved.', null],
  [15, 'Custom Event rename breaks existing charts', 'Renaming a custom event does not propagate to existing charts that reference it.', 'FR', 'Open', 'Closed', '384657', 'https://help.amplitude.com/hc/en-us/requests/384657', '53417952', 'https://app.productboard.com/notes/53417952', 'Unprocessed', 'None', 'Analytics', 'Kateryna Osypova', '2025-02-19', 'Charts still reference old event name after rename. Would need rename propagation logic.', 'AMP-148774'],
  [16, 'Percentage point change in time comparisons', 'Time comparison charts show percentage change instead of percentage point change.', 'FR', 'Open', 'Closed', '385281', 'https://help.amplitude.com/hc/en-us/requests/385281', '53697967', 'https://app.productboard.com/notes/53697967', 'Unprocessed', 'None', 'Analytics', 'Kateryna Osypova', '2025-02-25', 'UX issue in chart comparisons. FR logged but not processed.', null],
  [17, 'Expire Persisted Properties after specific event', 'No mechanism to expire persisted properties after a specific event fires.', 'FR', 'Open', 'Closed', '389995', 'https://help.amplitude.com/hc/en-us/requests/389995', '54240981', 'https://app.productboard.com/notes/54240981', 'Unprocessed', 'None', 'Analytics', 'Markus Buss', '2025-03-20', 'Would require new property lifecycle management feature.', null],
  [18, 'Array splitting / project switching bug', 'Array splitting configuration gets lost or behaves inconsistently when switching between projects.', 'Bug', 'Open', 'On Hold', '392950', 'https://help.amplitude.com/hc/en-us/requests/392950', null, null, 'Not Logged', 'None', 'Analytics', 'Florian Götting', '2025-04-25', 'Active bug. Engineering investigating. On hold pending fix.', 'AMP-141321'],
  [19, 'Event properties in user-based visualisations', 'Event properties cannot be used in user-based chart visualisations (e.g. user composition).', 'FR', 'Open', 'Closed', '393788', 'https://help.amplitude.com/hc/en-us/requests/393788', null, null, 'Not Logged', 'None', 'Analytics', 'Sebastian Damm', '2025-05-01', 'Architectural limitation. Event properties are event-scoped and cannot be projected to user-level aggregations without explicit mapping.', null],
  [20, 'Data Table labels wrong and non-editable', 'Data Table chart type shows incorrect labels and they cannot be edited.', 'Bug', 'Open', 'Open', '394661', 'https://help.amplitude.com/hc/en-us/requests/394661', null, null, 'Not Logged', 'None', 'Analytics', 'Kateryna Osypova', '2025-05-15', 'Active ticket. CAP-388 logged in Linear.', 'CAP-388'],
]

export default async function handler(req, res) {
  if (!authCheck(req)) return unauthorized(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const db = getDb()

  try {
    await db.executeMultiple(SEED_SQL)

    const existing = await db.execute('SELECT COUNT(*) as count FROM tickets')
    if (existing.rows[0].count > 0) {
      return res.status(200).json({ message: 'Database already seeded', count: existing.rows[0].count })
    }

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
