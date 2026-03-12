# Broker Activity Tracker

Internal performance management application for a real estate sales department. Brokers submit daily reports; heads and admins view team analytics, set monthly plans, and manage comments. All data is stored in **Google Sheets**.

## Tech stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- **Auth.js** (Credentials + JWT)
- **Google Sheets API** as primary storage
- **Recharts** for charts
- **Vercel** deployment

## Roles

- **Manager**: Own reports, personal analytics, view own plans.
- **Head**: Same as manager + team dashboard, missed reports, comments, set plans for team brokers.
- **Admin**: Full access + users, settings, audit log, integrations.

## Google Sheets setup

1. Create a new Google Sheet (or use existing).
2. Create the following **tabs** with **exact header row** in row 1:

### `users`
`user_id` | `full_name` | `email` | `username` | `password_hash` | `role` | `team_id` | `team_name` | `is_active` | `telegram_chat_id` | `reminder_email` | `created_at` | `updated_at`

### `daily_reports`
`report_id` | `user_id` | `report_date` | `buyer_incoming_lead_total` | `buyer_contact_established` | `buyer_qualified` | `buyer_agents` | `buyer_meeting_confirmed` | `buyer_meeting_held` | `buyer_number_of_bookings` | `buyer_booking_commission_amount` | `seller_incoming_requests` | `seller_number_of_cold_calls` | `seller_requested_documents` | `seller_sent_contract` | `seller_objects_entered_xoms` | `seller_listed_property` | `seller_sold_objects` | `seller_total_sales_amount` | `created_at` | `updated_at` | `updated_by`

### `monthly_plans`
`plan_id` | `user_id` | `team_id` | `year` | `month` | `metric_key` | `plan_value` | `created_at` | `updated_at` | `updated_by`

### `working_days` (optional)
`date` | `is_working_day` | `year` | `month` | `source`

### `comments`
`comment_id` | `target_type` | `target_id` | `subject_user_id` | `author_user_id` | `visibility` | `comment_text` | `created_at` | `updated_at`

### `reminders`
`reminder_id` | `user_id` | `report_date` | `channel` | `status` | `sent_at` | `payload_json` | `created_at`

### `settings`
`key` | `value` | `updated_at`

### `audit_log`
`log_id` | `user_id` | `action` | `entity_type` | `entity_id` | `payload_json` | `created_at`

3. **Share the sheet** with your Google service account email (Editor).
4. Add at least one user row in `users`. Use **bcrypt** to hash the password, e.g.:

```bash
node -e "import('bcryptjs').then(async b => { console.log(await b.default.hash('YourPassword', 10)); })"
```

Fill `role` with `manager`, `head`, or `admin`. For head, set `team_id` and `team_name` so they see their team.

## Environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Private key (replace `\n` with real newlines if needed) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID from the sheet URL |
| `AUTH_SECRET` | Random string for JWT (e.g. `openssl rand -hex 32`) |
| `AUTH_TRUST_HOST` | `true` on Vercel |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; production URL on Vercel |
| `INITIAL_ADMIN_USERNAME` | (optional) First admin username for seeding |
| `INITIAL_ADMIN_EMAIL` | (optional) First admin email |
| `INITIAL_ADMIN_PASSWORD_HASH` | (optional) Bcrypt hash for first admin |
| `TELEGRAM_BOT_TOKEN` | (optional) For Telegram reminders; create a Bot via @BotFather and set chat IDs in `users.telegram_chat_id` |
| `CRON_SECRET` | (optional) Secret for protecting `/api/cron/reminders`; set in Vercel Cron or call with `Authorization: Bearer <secret>` or `x-cron-secret` header |
| `EMAIL_PROVIDER_API_KEY` | (optional) For email reminders |
| `EMAIL_FROM_ADDRESS` | (optional) Sender address |

## Reminders (Telegram)

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather), get the token and set `TELEGRAM_BOT_TOKEN`.
2. For each user who should receive reminders, set `telegram_chat_id` in the `users` sheet (numeric chat ID; user must have started a chat with the bot).
3. Call the cron endpoint to send reminders for a given date (default: yesterday):
   - `GET /api/cron/reminders?date=YYYY-MM-DD` or `POST /api/cron/reminders` with body `{ "date": "YYYY-MM-DD" }`.
   - Send header `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`.
4. On Vercel, add a Cron Job that hits this URL with the secret (e.g. daily at 20:00).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with a user from the `users` sheet (username or email + password).

## Deploy on Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all environment variables in Project → Settings → Environment Variables.
3. Set `NEXTAUTH_URL` to `https://your-project.vercel.app`.
4. Deploy. The app uses the `master` branch by default.

## Daily targets

- **Working days**: Monday–Friday (configurable via `working_days` sheet).
- **Daily baseline** = monthly plan ÷ total working days in month.
- **Required per remaining workday** = (monthly plan − actual MTD) ÷ remaining working days.

## Export

- **CSV**: From the Analytics page use "Export CSV", or `GET /api/export/csv?start=...&end=...` (authenticated).
- **PDF (personal)**: From Analytics use "Export PDF", or `GET /api/export/pdf/personal?start=...&end=...` (authenticated).
- **PDF (team)**: From Team dashboard use "Export PDF", or `GET /api/export/pdf/team?start=...&end=...` (Head/Admin only).

## Scoring

- A composite **score (0–100)** is shown in Personal Analytics and in the report flow. It combines buyer/seller activity and results, plan adherence, and reporting discipline. Weights are configurable in `config/scoreWeights.ts`.

## License

Private / internal use.
