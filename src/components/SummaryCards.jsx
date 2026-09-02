import { useMemo, useState } from "react";
import { formatMoney } from "../lib/money.js";
import { totalSpent } from "../lib/balances.js";

export default function SummaryCards({ members, expenses, onAddMember }) {
  const [name, setName] = useState("");

  const perPerson = useMemo(() => {
    return members.map((m) => {
      const paid = expenses
        .filter((e) => e.paidBy === m.id)
        .reduce((s, e) => s + Number(e.amount), 0);
      return { id: m.id, name: m.name, paid };
    });
  }, [expenses]);

  const spent = totalSpent(expenses);

  return (
    <section className="card">
      <h2>Summary</h2>
      <div className="summary-grid">
        <div className="stat">
          Expenses
          <b>{expenses.length}</b>
        </div>
        <div className="stat">
          Group total
          <b>{formatMoney(spent)}</b>
        </div>
        <div className="stat">
          Members
          <b>{members.length}</b>
        </div>
        <div className="stat">
          Avg / person
          <b>{formatMoney(members.length ? spent / members.length : 0)}</b>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="legend">Paid so far</div>
        {perPerson.map((p) => (
          <div className="person-stat" key={p.id}>
            <span>{p.name}</span>
            <span>{formatMoney(p.paid)}</span>
          </div>
        ))}
      </div>
      <form
        style={{ marginTop: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAddMember(trimmed);
          setName("");
        }}
      >
        <div className="row">
          <div className="field">
            <label htmlFor="newMember">Add member</label>
            <input
              id="newMember"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </div>
          <button className="btn ghost" type="submit" style={{ alignSelf: "end" }}>
            Add
          </button>
        </div>
      </form>
    </section>
  );
}
