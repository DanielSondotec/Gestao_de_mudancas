import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useChanges } from "../hooks/useChanges";
import { todayISO, formatDate } from "../utils/dates";
import "../styles/ui.css";

// Concluir (com data) ou reabrir uma ação de uma mudança.
function CompleteAction({ changeId, action }) {
  const { completeAction, reopenAction } = useChanges();
  const [date, setDate] = useState(todayISO());

  if (action.termino) {
    return (
      <div className="inline-complete">
        <span>{formatDate(action.termino)}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon no-print"
          title="Reabrir ação"
          onClick={() => reopenAction(changeId, action.id)}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="inline-complete no-print">
      <input
        type="date"
        className="input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Data de término"
      />
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={!date}
        onClick={() => completeAction(changeId, action.id, date)}
      >
        <Check size={14} /> Concluir
      </button>
    </div>
  );
}

export default CompleteAction;
