const CATEGORIES = ["All", "Food", "Travel", "Fun", "Stay"];

export default function Filters({
  members,
  query,
  category,
  paidBy,
  onQuery,
  onCategory,
  onPaidBy,
}) {
  return (
    <section className="card">
      <h2>Filter</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Description…"
          />
        </div>
        <div className="field">
          <label htmlFor="paidBy">Paid by</label>
          <select
            id="paidBy"
            value={paidBy}
            onChange={(e) => onPaidBy(e.target.value)}
          >
            <option value="">Anyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 12 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${category === c ? "on" : ""}`}
            onClick={() => onCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
