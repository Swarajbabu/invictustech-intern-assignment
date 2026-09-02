import { formatMoney } from "../lib/money.js";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function BalancesPanel({ members, balances }) {
  return (
    <section className="card">
      <h2>Balances</h2>
      {members.map((m) => {
        const bal = Number(balances[m.id] || 0);
        let label = "settled up";
        let cls = "settled";
        if (bal > 0.005) {
          label = `owes ${formatMoney(bal)}`;
          cls = "owe";
        } else if (bal < -0.005) {
          label = `is owed ${formatMoney(-bal)}`;
          cls = "owed";
        }
        return (
          <div className="balance-row" key={m.id}>
            <div className="who">
              <span className="avatar" style={{ background: m.color }}>
                {initials(m.name)}
              </span>
              {m.name}
            </div>
            <div className={cls}>{label}</div>
          </div>
        );
      })}
    </section>
  );
}
