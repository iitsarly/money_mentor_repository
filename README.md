# Money Mentor MVP v1.2

Money Mentor is a student-oriented personal finance demo, built with **React + Vite + JavaScript**. It uses the original, light-purple Money Mentor theme. No Java runtime or bank connection is required.

## Run on Windows with VS Code

1. Extract the entire ZIP archive.
2. Open the **`money-mentor-mvp`** folder in VS Code. Verify that `package.json` is immediately inside that folder.
3. Open **Terminal → New Terminal** and run:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```
4. Open the Local URL printed by Vite (usually `http://localhost:5173/`).

To generate a deployable version, run `npm.cmd run build`; Vite will write a `dist` folder. `npm.cmd test` runs the included data validation tests with Node.js.

## Features retained from the original version

- Overview with monthly spending, category breakdown, and recent activity
- Income and expense tracking and search
- Savings goals with progress indicators
- Due-date list and paid/unpaid bill statuses
- Daily/monthly/quarterly reports and CSV export
- Rule-based educational financial assistant
- Browser `localStorage`, using the **same original key** (`money-mentor-demo-v1`)
- Dynamic income/expense labels, delete confirmations, and ten-second Undo

## New in v1.2

### 1. Edit transactions and monthly budget

- In **Transactions**, use the pencil icon beside an item to edit its description, type, amount, category, or date. A transaction linked to a recorded bill cannot be changed from an expense into income.
- On **Overview**, select **Edit budget** to set the current month's spending limit. A month's limit is stored in `monthlyBudgets`, and months without a custom limit use the original `budget` value. Reports, overview summaries, and assistant budget estimates use the correct current-month limit.

### 2. Improve savings goals

- Create or edit the goal name, icon, target, and saved amount.
- Use **Add savings** to record a manual increase, or **Correct balance** to reduce an earlier value. The dialog previews the new total and prevents a negative balance.
- The latest manual contribution/correction is shown beneath the goal. These entries do not transfer real money.

### 3. JSON backup and restore

- Open **Data & settings → Download backup** to create `money-mentor-backup-YYYY-MM-DD.json`.
- Use **Choose backup file** to import a Money Mentor JSON backup. The app validates its structure and shows record counts before asking you to **Replace & restore**.
- The import also recognizes original v1-format data objects, to support old entries.
- Backups are plain, **unencrypted JSON** and should be stored privately. Do **not** enter passwords, account numbers, or sensitive financial information.
- Automatic saving continues in the browser via `localStorage`. Importing is an explicit replace operation, and restoring never accesses your bank.

### 4. Improve bill tracking

- Edit bill name, amount and due date. Overdue unpaid bills are labeled.
- When marking a bill paid, choose **Mark paid only** (if you've already logged the payment) or **Mark paid + record expense** (if you want to add it to Transactions now).
- Payment expenses are linked to bills; re-marking an already linked bill paid does **not** add a duplicate transaction. Marking a bill unpaid does **not** delete its historical expense.
- An edited bill amount does not retroactively alter an existing transaction—edit that expense separately if needed.

### 5. First-use onboarding and mobile improvements

- First-time visitors choose between **fictional sample data** and an **empty workspace**. Existing users with entries in the original storage key skip onboarding.
- **Data & settings** also includes a quick-start guide and separate reset/clear options.
- Improved touch-friendly forms, mobile bill layout, scrollable sidebar, and scrollable popups.

## Compatibility & migration

**No migration step is required** for the prior browser data format. The original `money-mentor-demo-v1` key is unchanged. Old records are normalized in memory with `monthlyBudgets: {}`, optional savings activity, and optional bill payment links.

Important: `localStorage` is scoped to the exact website origin. Data saved at an existing Vercel URL does **not** automatically appear in a new `localhost` origin. Download a JSON backup from the old site if the old version supports backups, or otherwise preserve the previous local storage/origin before switching. Updating the source ZIP **does not deploy** it to Vercel; deploy the new `dist` build separately.

## Validation

The source was parsed/transpiled for syntax with TypeScript's JSX parser. Included Node tests check legacy-data compatibility, monthly budgets, backup round-trips, and malformed-data rejection. A local mock-React render simulation was also run against key workflows (create/edit/delete/Undo transaction, edit budget, savings, bill payment, backup restore), and it passed. The official Vite production build could not be run in the preparation environment because the npm registry was unreachable. On your computer, **run `npm.cmd install`, `npm.cmd test`, and `npm.cmd run build`** as final verification.

See `TEST_CHECKLIST.md` for click-by-click testing.
