# Fressnapf Support Tracker

Shared issue tracker between Amplitude and Fressnapf. Tracks support tickets, feature requests, and their status across Zendesk, Productboard, and internal engineering systems.

## Setup

### 1. Turso Database

1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Sign up / login: `turso auth login`
3. Create a database: `turso db create fressnapf-tracker`
4. Get the URL: `turso db show fressnapf-tracker --url`
5. Create a token: `turso db tokens create fressnapf-tracker`

### 2. Local Development

```bash
cp .env.example .env
# Fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, APP_PASSWORD
npm install
npm run dev
```

For local API development, install Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel
3. Add environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `APP_PASSWORD`
4. Deploy
5. Seed the database: `curl -X POST https://your-app.vercel.app/api/seed -H "Authorization: Bearer YOUR_PASSWORD"`

### 4. Share with Fressnapf

Send them the Vercel URL and the shared password. They can:
- View all tickets and their status
- Update the Fressnapf status column
- Add notes
- Export the current view as markdown

## Stack

- Frontend: React + Vite + Tailwind CSS
- Database: Turso (SQLite edge, libSQL)
- API: Vercel Serverless Functions
- Hosting: Vercel

## Without Turso

The app works without Turso configuration — it falls back to hardcoded seed data (read-only mode). Useful for local preview with `npm run dev`.
