# Expense Dashboard

A browser-only dashboard that turns an Excel/CSV expense export into a visual
breakdown of where money is going — and flags the categories that are eating
up a disproportionate share of spend so you can rein them in.

Live on GitHub Pages once merged to the default branch; open `index.html`
directly (or serve the folder) to run it locally. All parsing happens
client-side with [SheetJS](https://sheetjs.com/) — no file is ever uploaded
to a server.

## Using it

1. Open the page and click **Upload Excel / CSV** (or drag a file onto the
   drop zone). `.xlsx`, `.xls` and `.csv` are supported.
2. The app guesses which columns are Date, Category, Description and Amount.
   Fix the mapping if needed, then click **Build dashboard**.
3. No file handy? Click **Try sample data** to explore the dashboard with a
   built-in example dataset.

## What the dashboard shows

- **Summary stats** — total spend, transaction count, average transaction,
  top category, and how many categories are flagged.
- **Major spend alerts** — any category consuming more than a configurable
  share of total spend (default 15%, adjustable via the slider) is called
  out with its amount, share of total, and transaction count.
- **Category charts** — a bar chart ranking categories by spend and a
  doughnut chart showing each category's share of the total.
- **Monthly trend** — a line chart of total spend per month, and a month
  filter to drill into any single month.
- **Top transactions** — the 15 largest individual transactions.
- **Category table** — every category with its totals and a status badge
  (Under control / Watch / Needs control) based on the threshold.

## Expected input format

Any spreadsheet with at least a numeric amount column works; a Date and
Category column make the dashboard far more useful. Typical headers:

| Date       | Category   | Description         | Amount |
|------------|------------|----------------------|--------|
| 2026-06-02 | Rent       | Monthly rent          | 32000  |
| 2026-06-03 | Groceries  | Supermarket order     | 3200   |

Notes:

- Amounts are treated as expenses regardless of sign (negative/parenthesized
  values are read as positive spend), so keep income rows out of the file.
- Dates in `YYYY-MM-DD`, `DD/MM/YYYY` or native Excel date cells are all
  supported.
