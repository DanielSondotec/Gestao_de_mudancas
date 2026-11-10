import { useEffect, useMemo, useReducer, useRef } from "react";
import { ChangesContext } from "./changesContext";
import { changesReducer } from "./changesReducer";
import { createSeed } from "../data/seed";
import { nextChangeId } from "../utils/changes";

const STORAGE_KEY = "sgi-gestao-mudancas:v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // armazenamento indisponível ou JSON inválido: cai nos dados de exemplo
  }
  return createSeed();
}

export function ChangesProvider({ children }) {
  const [changes, dispatch] = useReducer(changesReducer, undefined, load);

  // evita estado obsoleto ao gerar o próximo ID dentro de callbacks estáveis
  const latest = useRef(changes);
  useEffect(() => {
    latest.current = changes;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    } catch {
      // sem persistência (modo privado / cota): o app segue funcionando em memória
    }
  }, [changes]);

  const api = useMemo(
    () => ({
      addChange(data) {
        const year = (data.data || "").slice(0, 4) || String(new Date().getFullYear());
        const id = nextChangeId(latest.current, year);
        dispatch({ type: "add", change: { ...data, id } });
        return id;
      },
      updateChange: (id, data) => dispatch({ type: "update", id, data }),
      completeAction: (id, actionId, date) => dispatch({ type: "completeAction", id, actionId, date }),
      reopenAction: (id, actionId) => dispatch({ type: "reopenAction", id, actionId }),
      verifyEficacia: (id, payload) => dispatch({ type: "verifyEficacia", id, ...payload }),
      reopenEficacia: (id) => dispatch({ type: "reopenEficacia", id }),
      approveChange: (id, date) => dispatch({ type: "approva", id, date }),
      revokeApproval: (id) => dispatch({ type: "revokeApproval", id }),
      deleteChange: (id) => dispatch({ type: "delete", id }),
      replaceAll: (list) => dispatch({ type: "replaceAll", changes: list }),
      resetToSeed: () => dispatch({ type: "replaceAll", changes: createSeed() }),
    }),
    [],
  );

  const value = useMemo(() => ({ changes, ...api }), [changes, api]);

  return <ChangesContext.Provider value={value}>{children}</ChangesContext.Provider>;
}
