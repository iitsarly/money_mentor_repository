# Money Mentor MVP — Usability Update

This update modifies the **original Money_Mentor_MVP** React + Vite project. It preserves the application's layout, navigation, demo data structure, and `money-mentor-demo-v1` browser storage key.

## Changes requested by the project manager

1. **Context-specific income and expense forms.** Selecting Income shows **Add income**, **Income source**, an income-appropriate description example, **Income amount ($)**, and **Add income**. Selecting Expense shows **Add expense**, **What was this expense for?**, an expense-appropriate example, **Expense amount ($)**, and **Add expense**. The form changes immediately when Type changes.
2. **Clear savings starting value.** The savings-goal form now labels the optional field **Starting savings ($) — optional**, leaves it visually blank, and explains that leaving it blank starts at $0. Saving a blank value still stores a numeric zero; no money is moved.
3. **Delete confirmation.** Deleting a transaction, savings goal, or bill opens an in-app confirmation dialog. **Cancel**, **Escape**, and clicking outside the dialog cancel the action. The dialog identifies the selected item and explains the effect.
4. **Undo deletion.** After confirming a deletion, a confirmation toast shows an **Undo** button for **10 seconds**. Selecting Undo restores the deleted record (including its original values and position). Totals automatically recalculate. You can undo the most recent deletion; a later notification or deletion replaces the earlier Undo action.

## Manual regression test checklist

- [ ] Open **Transactions → Add transaction**. Choose **Income** and verify title, description label, placeholder, amount label, and button all say income-specific text.
- [ ] Switch to **Expense**. Verify the corresponding expense labels and placeholder update immediately; the category selector appears only for expenses.
- [ ] Add a sample income and expense. Check that they appear under Transactions and update summaries.
- [ ] Open **Savings goals → New goal**. Confirm the Starting savings field is blank and has explanatory help text.
- [ ] Create a savings goal without entering starting savings. Confirm it displays **$0.00 saved**.
- [ ] In **Transactions**, click the trash icon. Confirm that **Cancel** leaves the record intact; repeat and choose **Delete**.
- [ ] Immediately click **Undo**. Confirm that the record returns and dashboard/report totals return to their previous values.
- [ ] Repeat deletion for a **Savings goal** and an **Upcoming bill**, testing both Cancel and Undo.
- [ ] Delete one item without selecting Undo. Confirm that Undo disappears after about ten seconds and the item stays deleted.
- [ ] Reload the page to confirm remaining and restored data persist in browser localStorage.
- [ ] Check the app on a narrow/mobile browser viewport.

## Install / run (Windows PowerShell)

Open the **money-mentor-mvp** directory containing `package.json` and run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Vite URL displayed in the terminal, usually `http://localhost:5173/`.

### Existing Vercel website

These edits change your local source package; they do **not** automatically update an existing Vercel deployment. Re-deploy this updated project using your established Vercel workflow (or commit and push it if your Vercel project is connected to a Git repository). Browser localStorage is local to each website origin and browser profile; changing the origin may not transfer existing demo data.

## Testing status

The JSX source was parsed and transpiled successfully using a TypeScript JSX parser. A complete Vite production build could not be run in the packaging environment because `npm install` could not complete. Please run `npm.cmd install` and `npm.cmd run build` locally, then perform the manual regression tests above.
