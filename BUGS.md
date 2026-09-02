# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

## Bug 1

**How to reproduce:** Open the app. The expense list says "Newest first". The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing oldest expenses first. Newest should be at the top.

**What I changed:** The sort in `ExpenseList.jsx` was comparing `a.date - b.date`, which sorts ascending (oldest first). Flipped it to `b.date - a.date` so the newest date comes first, matching the "Newest first" label above the list.

---

## Bug 2

**How to reproduce:** Look at the "Uber to airport" expense in the demo data — $60, paid by Diya, split only between Aisha and Ben (Diya didn't ride). Check Diya's balance.

**What is wrong:** Diya should get the whole $60 back since she wasn't on the split, but she was only getting credited for $30 of it. Someone paying for other people without being in the split themselves was getting quietly charged a share anyway.

**What I changed:** `computeBalances` in `src/lib/balances.js` had an extra block that ran whenever the payer wasn't in the split, and it subtracted `amount / splitWith.length` from the payer's balance a second time. The payer already gets `+= amount` at the top of the loop, and anyone actually listed in `shares` gets their share subtracted — this extra block was double-dipping on the payer for no reason. Deleted it.

---

## Bug 3

**How to reproduce:** Open the Balances panel. Aisha clearly put more money into the trip than she spent on herself (groceries, museum tickets), but the panel says she "owes" money, and Diya, who's owed money, shows as "settled" or worse.

**What is wrong:** The owes / is-owed labels in the Balances panel were backwards.

**What I changed:** In `computeBalances` and `suggestSettlements`, a positive balance means you're in credit (the group owes you), and negative means you owe. `BalancesPanel.jsx` had that flipped — it labeled positive balances as "owes" and negative as "is owed". Swapped the two branches so the panel agrees with the actual balance math (and with the Settle Up panel, which was already using the correct direction).

---

## Bug 4

**How to reproduce:** Hard to hit from the demo data directly, but happens any time a debtor and a creditor end up owing/being owed the exact same amount.

**What is wrong:** When two people's balances match exactly, the settle-up loop in `settle.js` just moved on to the next pair without recording a transfer for them, so that pair would silently vanish from the settle-up list even though money still needs to move between them.

**What I changed:** Added the missing `transfers.push(...)` call in the equal-amounts branch of `suggestSettlements` (`src/lib/settle.js`), same as the other two branches.

---

## Bug 5

**How to reproduce:** Use the "Paid by" dropdown in the Filter panel and pick any member.

**What is wrong:** It always says "No expenses match these filters", no matter who you pick — even someone who obviously paid for things.

**What I changed:** The filter compared `e.paidBy` (a number) against `paidBy` straight from the `<select>` (a string), so `!==` was always true. Coerced it with `Number(paidBy)` in the filter in `App.jsx`.

---

## Bug 6

**How to reproduce:** Type something into Search or click a category chip so the expense list is narrower than the full list, then delete or edit the amount on one of the visible rows.

**What is wrong:** It deletes or edits the wrong expense. Sometimes a completely different row than the one you clicked.

**What I changed:** `ExpenseList` sorts and `App.jsx` filters the array before it gets rendered, but the delete/edit handlers were passing the row's *position in that filtered, sorted list* down into the reducer, which then spliced `state.expenses` (the full, unfiltered, differently-ordered array) at that same position. Switched everything to use the expense's own `id` instead of its array index — `ExpenseList.jsx` now passes `expense.id`, and `DELETE_EXPENSE`/`UPDATE_EXPENSE` in `store.js` find the expense by `id` instead of splicing by index.

---

## Bug 7

**How to reproduce:** Load the app once (so it saves to localStorage), then just refresh the page.

**What is wrong:** After a refresh, "Newest first" stops sorting correctly — the order looks random.

**What I changed:** On first load, `seed.json`'s date strings get turned into real `Date` objects by `hydrate()`. But once the state gets saved and reloaded, `loadState()` was doing `JSON.parse(raw)` directly and handing that straight back — `JSON.stringify` had already turned those `Date` objects back into plain strings, and they never got converted back. Subtracting two strings gives `NaN`, so the sort comparator quietly stopped working. Now `loadState` runs the parsed localStorage data through `hydrate()` too, same as it does for the seed.

---

## Bug 8

**How to reproduce:** Add a new person using the "Add member" box in the Summary card.

**What is wrong:** The new member doesn't show up in the "Paid so far" list right away. You have to add or edit an expense first before they appear.

**What I changed:** The `perPerson` calculation in `SummaryCards.jsx` maps over `members`, but its `useMemo` dependency array only had `expenses` in it — so adding a member didn't trigger a recompute, and it kept returning the stale cached list. Added `members` to the dependency array.
