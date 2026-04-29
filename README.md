# Crypto Trade Tax Analyzer

A full-stack web application for Indian crypto spot traders who want to upload exchange CSV files, match buy and sell lots with FIFO logic, review realized profit and open holdings, and export the active session as a clean CSV report.

## Live Website

**Live demo:** [https://crypto-trade-tax-analyzer.netlify.app/](https://crypto-trade-tax-analyzer.netlify.app/)

## Overview

Crypto Trade Tax Analyzer is built for practical spot-trade review, not generic portfolio fluff. The product focuses on:

- CSV-based trade ingestion
- FIFO lot matching
- realized trade analysis
- open holding visibility
- fee, GST, TDS, and base tax review
- responsive desktop and mobile dashboards
- one-click CSV export of the processed session

The app is designed to help traders quickly understand what happened in a trading session without manually cleaning spreadsheets for every review.

## Key Features

- Upload spot exchange CSV files and process them safely
- Match buys and sells pair-wise using FIFO
- Detect unmatched buy lots and show them as open holdings
- Skip malformed or non-executed rows without breaking the full report
- Apply saved exchange fee settings for buy-side and sell-side fees
- Calculate realized trade totals, tax drag, and final net impact
- Filter, sort, and review realized trades and open positions
- View analytics for profitability, taxes, and pair-level performance
- Export the processed session as a structured CSV file
- Use a dedicated mobile UI with a focused tab-based workflow
- Read in-app documentation that explains the calculation model in easy English

## Built For

This project is best suited for:

- Indian crypto spot traders
- FIFO-based trade review
- manual CSV-driven workflows
- audit-friendly trade analysis
- fast desktop and mobile inspection

This project is not currently tailored for:

- futures trading
- options trading
- margin or leverage workflows
- broker API sync
- exchange account linking
- multi-user account systems

## How It Works

### 1. Upload

The user uploads a spot exchange CSV file from the dashboard.

### 2. Validate

The backend checks the CSV structure, normalizes supported column names, and safely skips malformed rows.

### 3. Match Trades

Each sell is matched against the oldest available buy of the same pair using FIFO:

- first in
- first out

If a buy is only partly consumed, the remaining quantity is kept in **Open Holdings**.

### 4. Apply Exchange Fees

The app uses the saved exchange setup:

- exchange name
- buy fee percent
- sell fee percent

If buy fee is `0`, the app can keep buy-fee columns hidden to reduce clutter.

### 5. Calculate Trade Outcomes

For each realized cycle, the app calculates:

- Buy Value
- Sell Value
- Gross Profit
- Buy Fee
- Sell Fee
- Total Fees
- GST on Fees
- TDS
- Base Crypto Tax
- Net Profit in Hand
- Final Net Profit

### 6. Render the Report

The frontend shows:

- summary metrics
- realized trade table
- open holdings table
- analytics panels
- warnings
- CSV export action

## Calculation Model

### Core formulas

- `Buy Value = matched_qty x buy_price`
- `Sell Value = matched_qty x sell_price`
- `Gross Profit = sell_value - buy_value`
- `Buy Fee = buy_value x buy_fee_percent`
- `Sell Fee = sell_value x sell_fee_percent`
- `Total Fees = buy_fee + sell_fee`
- `GST on Fees = 18% of total fees`
- `TDS = 1% of sell value`
- `Base Crypto Tax = 30% of positive realized gain`
- `Net Profit in Hand = gross_profit - total_fees - gst - tds - tax`
- `Final Net Profit = net_profit_in_hand + tds`

### Easy-English interpretation

- Each sell is matched with the oldest available buy of the same pair.
- This is classic FIFO matching.
- If a buy is not fully used, the leftover quantity stays in open holdings.
- Buy fee and sell fee are applied separately based on the saved exchange setup.
- GST is applied to the fee layer, not to the full trade value.
- TDS is shown separately because it is withheld tax, not a trading cost.
- Final Net adds TDS back so the user can see the economic result separately from the withheld tax credit.

## India 2026 Tax and GST Notes

As of **April 28, 2026**, this dashboard follows a practical India crypto spot-trade review model.

### Modeled in the app

- `30%` base VDA tax on positive realized gain
- `1%` TDS on transfer consideration
- `18%` GST on exchange or service fees
- profile-based buy fee and sell fee treatment

### Important scope note

This app is meant for operational review and trader visibility. It does **not** claim to fully model every taxpayer-specific legal scenario.

Items not fully modeled include:

- surcharge
- `4%` health and education cess
- every threshold edge case under Section `194S`
- exchange-specific settlement quirks
- every legal interpretation outside this workflow

### Official references

- Section `115BBH`: <https://www.incometaxindia.gov.in/w/section-115bbh-2>
- Section `194S`: <https://incometaxindia.gov.in/Acts/Income-tax%20Act%2C%201961/2025/102120000000091302.htm>
- CBDT Circular `13/2022`: <https://incometaxindia.gov.in/Communications/Circular/Circular-No-13-2022.pdf>
- CBIC GST guidance: <https://cbic-gst.gov.in/gst-goods-services-rates.html>

## CSV Input

### Required columns

- `Time`
- `Contract`
- `Qty`
- `Side`
- `Exec.Price`

### Supported aliases

The parser accepts common variants such as:

- `Timestamp`
- `Quantity`
- `Filled Qty`
- `Price`
- `Symbol`
- `Order Value`
- `Fees`
- `Fees paid`
- `Commission`

### Sample input

```csv
Time,Contract,Qty,Side,Exec.Price
2026-04-01 10:15:00,BTC_INR,0.002,buy,6123450
2026-04-08 07:59:00,BTC_INR,0.002,sell,6284560
```

### Sample file

- [samples/sample-trades.csv](./samples/sample-trades.csv)

## Validation Behavior

The app is intentionally tolerant of imperfect exchange exports.

- malformed rows are skipped safely
- cancelled or non-executed rows are ignored
- unmatched sell quantities are surfaced as warnings
- warnings do not stop the rest of the report from rendering

## Export

### Current export format

- CSV only

### Export includes

- report metadata
- summary totals
- realized trades
- open holdings

### Default export filename

- `crypto-trade-tax-analyzer-spot-report.csv`

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

- `PORT`: backend port
- `CLIENT_ORIGIN`: frontend origin allowed by CORS
- `MAX_UPLOAD_MB`: maximum CSV upload size
- `VITE_API_BASE_URL`: frontend API base path
- `NODE_ENV`: runtime mode
- `PYTHON_EXECUTABLE`: legacy compatibility variable kept in config

## Local Development

### Prerequisites

- Node.js 18 or newer
- npm

### Install dependencies

```powershell
npm install
npm run install:all
```

### Run the app

```powershell
npm run dev
```

Default local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:5000`

### Run frontend and backend separately

```powershell
npm run dev:server
npm run dev:client
```

## Scripts

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

Request fields:

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

Returns the sample CSV or field information.

Optional query:

- `?format=json`

## Deployment

Current live setup:

- **Frontend:** Netlify
- **Backend:** Render

Live frontend:

- <https://crypto-trade-tax-analyzer.netlify.app/>

## Testing

Run backend tests:

```powershell
npm test --prefix backend
```

Build the frontend:

```powershell
npm run build --prefix client
```

## GitHub Update Flow

Whenever you make changes later:

```powershell
git status
git add .
git commit -m "Describe your update"
git push origin main
```

If you only changed specific files:

```powershell
git status
git add README.md client/src/components/AppHeader.jsx
git commit -m "Refine documentation and UI copy"
git push origin main
```

## Disclaimer

This project is a product-level review tool for crypto spot trading workflows. It is **not** financial advice, tax advice, or legal advice. Always verify important filings and tax treatment with a qualified professional.

---

Built for practical crypto spot-trade review, tax visibility, and cleaner reporting from raw exchange CSV exports.
