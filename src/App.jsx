import { useEffect, useMemo, useReducer, useState } from "react";
import seed from "./data/seed.json";
import {
  loadState,
  nextExpenseId,
  nextMemberId,
  persistState,
  reducer,
} from "./state/store.js";
import { computeBalances } from "./lib/balances.js";
import { suggestSettlements } from "./lib/settle.js";
import AddExpenseForm from "./components/AddExpenseForm.jsx";
import BalancesPanel from "./components/BalancesPanel.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import Filters from "./components/Filters.jsx";
import SettleUpPanel from "./components/SettleUpPanel.jsx";
import SummaryCards from "./components/SummaryCards.jsx";

const COLORS = ["#5b4b8a", "#1f6f64", "#b85c38", "#3d5a80", "#7a4e2d", "#2c4c3b"];

export default function App() {
  const [state, dispatch] = useReducer(reducer, seed, loadState);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [paidBy, setPaidBy] = useState("");

  useEffect(() => {
    persistState(state);
  }, [state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.expenses.filter((e) => {
      if (q && !e.description.toLowerCase().includes(q)) return false;
      if (category !== "All" && e.category !== category) return false;
      if (paidBy !== "" && e.paidBy !== paidBy) return false;
      return true;
    });
  }, [state.expenses, query, category, paidBy]);

  const balances = useMemo(
    () => computeBalances(state.members, state.expenses),
    [state.members, state.expenses]
  );
  const transfers = useMemo(
    () => suggestSettlements(balances, state.members),
    [balances, state.members]
  );

  function addExpense(partial) {
    dispatch({
      type: "ADD_EXPENSE",
      expense: { id: nextExpenseId(), ...partial },
    });
  }

  function addMember(name) {
    dispatch({
      type: "ADD_MEMBER",
      member: {
        id: nextMemberId(state.members),
        name,
        color: COLORS[state.members.length % COLORS.length],
      },
    });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">FairShare</div>
          <h1>{state.groupName}</h1>
          <p className="subtitle">
            Shared expenses for four friends. Numbers and labels should match
            the spec in the README.
          </p>
        </div>
      </header>

      <div className="workspace">
        <div className="stack">
          <Filters
            members={state.members}
            query={query}
            category={category}
            paidBy={paidBy}
            onQuery={setQuery}
            onCategory={setCategory}
            onPaidBy={setPaidBy}
          />
          <AddExpenseForm members={state.members} onAdd={addExpense} />
          <ExpenseList
            expenses={filtered}
            members={state.members}
            onDeleteAt={(index) => dispatch({ type: "DELETE_EXPENSE", index })}
            onUpdateAt={(index, patch) =>
              dispatch({ type: "UPDATE_EXPENSE", index, patch })
            }
          />
        </div>
        <div className="stack">
          <SummaryCards
            members={state.members}
            expenses={state.expenses}
            onAddMember={addMember}
          />
          <BalancesPanel members={state.members} balances={balances} />
          <SettleUpPanel transfers={transfers} />
        </div>
      </div>
    </div>
  );
}
