# Crypto Trade Tax Analyzer

A full-stack web application for uploading exchange CSV files, matching trades with FIFO logic, analyzing realized profit and tax drag, reviewing open positions, and exporting the active session as a clean CSV report.

The project is designed as a finance-first dashboard, with separate desktop and mobile experiences, validation-safe CSV ingestion, and a premium dark/light UI built around fast review rather than raw spreadsheets.

## What This Website Does

`Crypto Trade Tax Analyzer` helps you:

- upload exchange trade-history CSV files
- parse and validate trade rows safely
- match buys and sells contract-wise using FIFO
- calculate realized P&L and tax deductions
- detect open positions from unmatched buy lots
- surface warnings without breaking the full report
- inspect analytics charts and summary cards
- export the current processed session to CSV

## Core Features

- FIFO trade matching by contract
- realized trade table with filters, sorting, totals, and pagination
- open positions table for unmatched lots
- KPI summary for buy value, sell value, profit, tax, and final net
- analytics charts for asset profitability, tax breakdown, monthly trend, and holding distribution
- CSV export containing metadata, summary, realized trades, and open positions
- safe warning handling for malformed rows and unmatched sell quantities
- responsive desktop and mobile UI with dedicated mobile tab flow
- fintech-style animated background that stays subtle behind the data

## Product Workflow

1. Upload a CSV file from the dashboard.
2. The backend parses and normalizes the file.
3. Trades are grouped by contract and matched using FIFO.
4. Summary totals, realized trades, open positions, analytics, and warnings are generated.
5. The frontend renders the report for desktop and mobile review.
6. The user can export the current processed session as a CSV file.

## Trade and Tax Logic

The processing engine applies these rules:

- `Buy Value = matched_qty * buy_price`
- `Sell Value = matched_qty * sell_price`
- `Gross Profit = sell_value - buy_value`
- `Fees = 0.1% of sell value`
- `GST on Fees = 18% of fees`
- `TDS = 1% of sell value`
- `30% Crypto Tax = applied only when gross profit is positive`
- `Net Profit in Hand = gross_profit - fees - gst - tds - crypto_tax`
- `Final Net Profit = net_profit_in_hand + tds`

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

The app is intentionally tolerant of imperfect exchange exports.

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
- open positions

### Export filename

- `crypto-trade-tax-analyzer-report.csv`

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

`A full-stack crypto trade tax analyzer with FIFO matching, tax analytics, warning-safe CSV processing, responsive dashboard UI, and CSV export.`

## Current Scope

Included now:

- CSV upload
- FIFO analysis
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

Built for practical crypto trade review, tax visibility, and cleaner audit-friendly reporting from raw exchange CSVs.
