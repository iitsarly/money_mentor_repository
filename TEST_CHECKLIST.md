# Money Mentor v1.2 — User acceptance checklist

Use fictional data only. To avoid altering your personal browser entries, test in a new private/incognito browser window.

## Launch & onboarding
- [ ] `npm.cmd install` and `npm.cmd run dev` succeed.
- [ ] First visit shows a welcome modal with two choices.
- [ ] "Explore sample data" shows prefilled demo records, or "Start with my own empty workspace" starts with empty records.
- [ ] Reloading the same origin retains your choice and entries, without showing onboarding again.

## Transactions
- [ ] Add income: modal title, description placeholder and button say **income**.
- [ ] Add expense: modal title, description placeholder and button say **expense**.
- [ ] Edit a transaction's amount, category, date and description. Totals update correctly.
- [ ] Delete a transaction: confirm first; click **Undo** to restore it and the original totals.

## Budgets
- [ ] On Overview, click **Edit budget**; change the limit and confirm the summary and progress bar update.
- [ ] The assistant uses the customized current-month limit in a budgeting answer.

## Savings
- [ ] Create a goal leaving starting savings blank, which means $0.
- [ ] Add $50 savings using the styled modal; verify updated total and progress.
- [ ] Correct $20 of savings; verify the goal is reduced by $20.
- [ ] Attempt to subtract more than the current savings: submission must be blocked.
- [ ] Edit target and name, and verify deletion confirmation / Undo.

## Bills
- [ ] Add and edit a bill, including its due date.
- [ ] Mark paid using **Mark paid only**: no expense is created.
- [ ] Mark another paid using **Mark paid + record expense**: one matching expense is created.
- [ ] Set that bill unpaid, then paid again: its linked expense is **not duplicated**.
- [ ] Delete a bill and verify its confirmation; an existing historical expense is retained.

## Backup and restore
- [ ] Open **Data & settings** and download a backup as JSON.
- [ ] Change or add a record after backing up.
- [ ] Choose the backup file. Verify the preview shows correct record counts and warns about replacing current data.
- [ ] Click **Cancel**: original records must remain unchanged.
- [ ] Import the same backup and confirm: original records should be restored.
- [ ] Try an invalid JSON file: show a useful error without changing saved data.
- [ ] The original browser `money-mentor-demo-v1` storage key is still in use.

## Mobile & accessibility
- [ ] Resize to a narrow phone view (about 375 px). The sidebar opens with the menu button and can scroll to **Data & settings**.
- [ ] Forms and confirmation dialogs fit and scroll on shorter screens.
- [ ] Bill rows, transaction edit buttons, and budget controls don't overlap.
- [ ] Escape and Cancel work on deletion confirmation.

## Test/build commands

```powershell
npm.cmd test
npm.cmd run build
```

The test suite runs with Node built-ins. A full browser/production build should be run after installing npm dependencies on your computer.
