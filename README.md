# Crypto Trade Tax Analyzer

A full-stack web application for spot crypto traders who want to upload spot exchange CSV files, match trades with FIFO logic, analyze realized profit and tax drag, review open holdings, and export the active session as a clean CSV report.

The project is designed as a finance-first dashboard for spot-market activity, with separate desktop and mobile experiences, validation-safe CSV ingestion, and a premium dark/light UI built around fast review rather than raw spreadsheets.

## What This Website Does

`Crypto Trade Tax Analyzer` helps spot traders:

- upload spot exchange trade-history CSV files
- parse and validate trade rows safely
- match buys and sells pair-wise using FIFO
- calculate realized P&L and tax deductions
- detect open holdings from unmatched buy lots
- surface warnings without breaking the full report
- inspect analytics charts and summary cards
- export the current processed session to CSV

## Core Features

- FIFO trade matching by spot pair
- local spot-trader profile with user name, exchange name, buy fee %, and sell fee %
- realized trade table with filters, sorting, totals, and pagination
- open holdings table for unmatched lots
- KPI summary for buy value, sell value, profit, tax, and final net
- analytics charts for pair profitability, tax breakdown, monthly trend, and holding distribution
- CSV export containing metadata, summary, realized trades, and open holdings
- safe warning handling for malformed rows and unmatched sell quantities
- responsive desktop and mobile UI with dedicated mobile tab flow
- fintech-style animated background that stays subtle behind the data

## Product Workflow

1. Open the website and save your spot-trader profile.
2. Upload a CSV file from the dashboard.
3. The backend parses and normalizes the file.
4. Trades are grouped by spot pair and matched using FIFO.
5. Buy-side and sell-side exchange fees are applied from the saved profile.
6. Summary totals, realized trades, open holdings, analytics, and warnings are generated.
7. The frontend renders the report for desktop and mobile review.
8. The user can export the current processed session as a CSV file.

## Trade and Tax Logic

The processing engine applies these rules:

- `Buy Value = matched_qty * buy_price`
- `Sell Value = matched_qty * sell_price`
- `Gross Profit = sell_value - buy_value`
- `Buy Fee = buy_value * buy_fee_percent`
- `Sell Fee = sell_value * sell_fee_percent`
- `Total Fees = buy_fee + sell_fee`
- `GST on Fees = 18% of fees`
- `TDS = 1% of sell value`
- `30% Crypto Tax = applied only when gross profit is positive`
- `Net Profit in Hand = gross_profit - fees - gst - tds - crypto_tax`
- `Final Net Profit = net_profit_in_hand + tds`

## India 2026 Tax and GST Notes

As of **April 27, 2026**, this project is aligned to a practical India spot-trader review model based on the official VDA tax framework.

### Official rule summary

- VDA transfer income is taxed at **30%** under Section `115BBH`.
- Only **cost of acquisition** is allowed; other deductions and VDA loss set-off are restricted under Section `115BBH`.
- TDS on VDA transfer consideration is **1%** under Section `194S`.
- Section `194S` also includes threshold rules:
  - `Rs. 10,000` for most payers
  - `Rs. 50,000` for specified persons
- This app models **18% GST on exchange/service fees** as a practical spot-trader assumption for taxable service charges.

### Important implementation note

This app currently models:

- profile-based spot-platform buy fee % and sell fee %
- base `30%` VDA tax on positive realized gain
- `1%` TDS on transfer value
- `18%` GST on exchange/service fees

This app does **not** fully model every taxpayer-specific 2026 nuance, including:

- surcharge
- `4%` health and education cess
- every threshold edge case under `194S`
- special treatment needed for non-standard exchange flows
- professional tax treatment outside the app's spot-trader workflow

### Why the GST note is worded this way

I am making an inference from official GST service-rate guidance rather than claiming there is a crypto-specific GST section for every spot trade scenario. The project treats GST as applying to the **exchange/service fee layer**, not as a blanket tax on the full traded value.

### Official references

- Income-tax Section `115BBH`: https://www.incometaxindia.gov.in/w/section-115bbh-2
- Income-tax Section `194S`: https://incometaxindia.gov.in/Acts/Income-tax%20Act%2C%201961/2025/102120000000091302.htm
- Income-tax FAQ on `194S` thresholds: https://www.incometaxindia.gov.in/w/is-there-any-minimum-amount-upto-which-tax-is-not-deducted-
- CBIC GST services rate booklet (`18%` bucket for services guidance): https://cbic-gst.gov.in/pdf/services-booklet-03July2017.pdf

## CSV Input Requirements

### Required columns

- `Time`
- `Contract`
- `Qty`
- `Side`
- `Exec.Price`

### Supported aliases

The parser also accepts common variants such as:

- `Timestamp`
- `Quantity`
- `Price`
- `Symbol`
- `Order Value`
- `Fees`
- `Commission`

### Example input

```csv
Time,Contract,Qty,Side,Exec.Price
2026-04-01 10:15:00,BTC_INR,0.002,buy,6123450
2026-04-08 07:59:00,BTC_INR,0.002,sell,6284560
```

### Sample file

- [sample-trades.csv](./samples/sample-trades.csv)

## Validation and Warning Behavior

The app is intentionally tolerant of imperfect spot-exchange exports.

- malformed rows are skipped safely
- cancelled or non-executed rows are ignored
- unmatched sell quantities are surfaced as warnings
- warnings do not stop the rest of the report from generating

## Export

### Current export format

- CSV only

### Export contents

Each exported file includes:

- report metadata
- summary totals
- realized trades
- open holdings

### Export filename

- `crypto-trade-tax-analyzer-spot-report.csv`

### Notes

- CSV is plain text, so it does not support borders, colors, or spreadsheet styling
- if you later want styled exports, the next logical upgrade is `.xlsx`

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios
- Recharts
- Lucide React

### Backend

- Node.js
- Express
- Multer
- Papa Parse
- Decimal.js

## Project Structure

```text
.
|-- backend
|   |-- package.json
|   |-- src
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config
|   |   |-- constants
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- routes
|   |   |-- services
|   |   `-- utils
|   `-- tests
|-- client
|   |-- package.json
|   `-- src
|       |-- components
|       |-- hooks
|       |-- layouts
|       |-- pages
|       |-- services
|       `-- utils
|-- samples
|-- .env.example
|-- .gitignore
|-- package.json
`-- README.md
```

## Environment Variables

Create a root `.env` file from `.env.example`.

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=10
VITE_API_BASE_URL=/api
NODE_ENV=development
PYTHON_EXECUTABLE=python
```

### Variable reference

- `PORT`: backend server port
- `CLIENT_ORIGIN`: frontend origin allowed by CORS
- `MAX_UPLOAD_MB`: upload size limit for CSV files
- `VITE_API_BASE_URL`: frontend API base path
- `NODE_ENV`: runtime mode
- `PYTHON_EXECUTABLE`: legacy/export compatibility variable kept in config

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm

### Install

From the project root:

```powershell
npm install
npm run install:all
```

### Start the project

Run frontend and backend together:

```powershell
npm run dev
```

Default local URLs:

- frontend: `http://localhost:5173`
- backend API: `http://localhost:5000`

### Run frontend and backend separately

```powershell
npm run dev:server
npm run dev:client
```

## Available Scripts

### Root

- `npm run install:all`
- `npm run dev`
- `npm run dev:server`
- `npm run dev:client`
- `npm run build`
- `npm run test`

### Backend

- `npm run dev`
- `npm start`
- `npm test`

### Client

- `npm run dev`
- `npm run build`
- `npm run preview`

## API Endpoints

### `POST /api/upload/process`

Uploads and processes a CSV file using `multipart/form-data`.

Request field:

- `file`
- `userName`
- `exchangeName`
- `buyFeePercent`
- `sellFeePercent`

Response sections:

- `summary`
- `realizedTrades`
- `openPositions`
- `analytics`
- `meta`
- `warnings`

### `POST /api/export/csv`

Accepts the processed report payload and returns a downloadable CSV file.

### `GET /api/sample-format`

Downloads the sample CSV file.

Optional:

- `?format=json` for schema-style field info

## UI Notes

- desktop and mobile layouts are intentionally different
- mobile uses a tabbed review flow for home, trades, holdings, and insights
- desktop keeps dense tables and wider analytics panels for faster scanning
- dark and light themes are both supported

## Best Fit

This version of the product is best suited for:

- spot crypto traders
- manual CSV-based tax review
- FIFO gain/loss analysis
- quick audit-friendly export workflows

This version is not specifically tailored for:

- futures or leverage trading
- options workflows
- broker API sync
- portfolio management across multiple live accounts

## Testing and Verification

Run backend tests:

```powershell
npm test --prefix backend
```

Build the client for production:

```powershell
npm run build --prefix client
```

## GitHub Upload Checklist

Before pushing this project to GitHub:

1. Initialize the repo:

```powershell
git init
git branch -M main
```

2. Create your local environment file:

```powershell
Copy-Item .env.example .env
```

3. Install dependencies if needed:

```powershell
npm install
npm run install:all
```

4. Verify the project:

```powershell
npm test --prefix backend
npm run build --prefix client
```

5. Commit only project source, not dependencies or secrets:

- `.gitignore` now excludes `node_modules`, build output, logs, and `.env`
- keep `.env.example` in the repo
- do not upload your real `.env`

6. First commit:

```powershell
git add .
git commit -m "Initial commit"
```

## Recommended GitHub Repo Description

`A full-stack crypto tax analyzer for spot traders with FIFO matching, tax analytics, warning-safe CSV processing, responsive dashboard UI, and CSV export.`

## Current Scope

Included now:

- CSV upload
- FIFO analysis for spot trades
- tax dashboard
- warnings
- analytics
- CSV export
- responsive UI

Not included now:

- broker/exchange API sync
- user accounts
- database persistence
- PDF export
- styled Excel export

## Future Upgrade Ideas

- `.xlsx` export with formatting
- authentication and saved sessions
- portfolio history storage
- more exchange-specific CSV presets
- downloadable tax summary packs

---

## How To Update GitHub After Future Changes

Whenever you make small updates later, use this flow:

```powershell
git status
git add .
git commit -m "Describe your update"
git push origin main
```

If you only changed a few files and want more control:

```powershell
git status
git add README.md client/src/components/AppHeader.jsx
git commit -m "Refine spot trader messaging"
git push origin main
```

Built for practical spot crypto trade review, tax visibility, and cleaner audit-friendly reporting from raw exchange CSVs.
