import { formatMoney } from "../lib/money.js";

export default function SettleUpPanel({ transfers }) {
  return (
    <section className="card">
      <h2>Settle up</h2>
      {transfers.length === 0 ? (
        <p className="empty">Everyone is settled.</p>
      ) : (
        transfers.map((t, i) => (
          <div className="transfer" key={`${t.from}-${t.to}-${i}`}>
            <strong>{t.fromName}</strong> pays <strong>{t.toName}</strong>{" "}
            {formatMoney(t.amount)}
          </div>
        ))
      )}
      <p className="hint">
        After these payments, every member's net should be $0.00.
      </p>
    </section>
  );
}
