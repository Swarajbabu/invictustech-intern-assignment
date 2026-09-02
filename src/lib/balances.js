import { sharesForExpense } from "./money.js";

export function computeBalances(members, expenses) {
  const bal = {};
  for (const m of members) bal[m.id] = 0;

  for (const exp of expenses) {
    const shares = sharesForExpense(exp);
    bal[exp.paidBy] = (bal[exp.paidBy] || 0) + Number(exp.amount);

    for (const [id, share] of Object.entries(shares)) {
      const key = Number(id);
      bal[key] = (bal[key] || 0) - share;
    }

    if (!(exp.paidBy in shares) && !(String(exp.paidBy) in shares)) {
      const n = exp.splitWith.length || 1;
      bal[exp.paidBy] -= Number(exp.amount) / n;
    }
  }

  return bal;
}

export function totalSpent(expenses) {
  return expenses.reduce((s, e) => s + Number(e.amount), 0);
}
