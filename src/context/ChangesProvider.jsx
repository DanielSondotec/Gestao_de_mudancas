
import { useEffect, useMemo, useReducer, useRef } from "react";
import { ChangesContext } from "./changesContext";
import { changesReducer } from "./changesReducer";
import { createSeed } from "../data/seed";
import { nextChangeId } from "../utils/changes";
import { todayISO } from "../utils/dates";
import { deleteAttachments } from "../utils/attachments";

const STORAGE_KEY = "sgi-gestao-mudancas:v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Se o armazenamento estiver indisponível, utiliza os dados iniciais.
  }

  return createSeed();
}

export function ChangesProvider({ children }) {
  const [changes, dispatch] = useReducer(changesReducer, undefined, load);

  const latest = useRef(changes);

  useEffect(() => {
    latest.current = changes;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    } catch {
      // O sistema continua funcionando em memória.
    }
  }, [changes]);

  const api = useMemo(() => {
      async function replaceAll(list) {
        const preservedIds = new Set(
          list.flatMap((change) =>
            (change.acoes ?? []).flatMap((action) =>
              (action.resolucaoAnexos ?? []).map((attachment) => attachment.id),
            ),
          ),
        );
        const obsoleteIds = latest.current.flatMap((change) =>
          (change.acoes ?? []).flatMap((action) =>
            (action.resolucaoAnexos ?? [])
              .map((attachment) => attachment.id)
              .filter((id) => !preservedIds.has(id)),
          ),
        );
        await deleteAttachments(obsoleteIds);
        dispatch({ type: "replaceAll", changes: list });
      }

      return {
      addChange(data) {
        const year =
          (data.data || "").slice(0, 4) ||
          String(new Date().getFullYear());

        const id = nextChangeId(latest.current, year);

        dispatch({
          type: "add",
          change: { ...data, id },
        });

        return id;
      },

      updateChange: (id, data) =>
        dispatch({ type: "update", id, data }),

      concluirAnalise: (id, payload) =>
        dispatch({ type: "concluirAnalise", id, ...payload }),

      completeAction: (id, actionId, date) =>
        dispatch({ type: "completeAction", id, actionId, date }),

      reopenAction: (id, actionId) =>
        dispatch({ type: "reopenAction", id, actionId }),

      // Pessoa designada apresenta a resolução.
      proposeResolution: (id, actionId, resolucao, date, anexos = []) =>
        dispatch({
          type: "proposeResolution",
          id,
          actionId,
          resolucao,
          anexos,
          date: date || new Date().toISOString().slice(0, 10),
        }),

      // Criador do plano aprova a resolução.
      approvePlan: (id, actionId, observacao, avaliador, date) =>
        dispatch({
          type: "approvePlan",
          id,
          actionId,
          observacao,
          avaliador,
          date: date || new Date().toISOString().slice(0, 10),
        }),

      // Criador do plano reprova a resolução.
      rejectPlan: (id, actionId, observacao, avaliador, date) =>
        dispatch({
          type: "rejectPlan",
          id,
          actionId,
          observacao,
          avaliador,
          date: date || new Date().toISOString().slice(0, 10),
        }),

      verifyEficacia: (id, payload) =>
        dispatch({ type: "verifyEficacia", id, ...payload }),

      reopenEficacia: (id) =>
        dispatch({ type: "reopenEficacia", id }),

      approveChange: (id, date) =>
        dispatch({ type: "approve", id, date }),

      revokeApproval: (id) =>
        dispatch({ type: "revokeApproval", id }),

      archiveChange: (id, por) =>
        dispatch({
          type: "archive",
          id,
          por,
          date: todayISO(),
        }),

      restoreArchivedChange: (id, por) =>
        dispatch({ type: "restoreArchive", id, por }),

      async deleteArchivedChange(id) {
        const change = latest.current.find((item) => item.id === id);
        if (!change?.arquivadaEm) {
          throw new Error("Somente mudanças arquivadas podem ser excluídas definitivamente.");
        }

        const attachmentIds = (change.acoes ?? []).flatMap((action) =>
          (action.resolucaoAnexos ?? []).map((attachment) => attachment.id),
        );
        await deleteAttachments(attachmentIds);
        dispatch({ type: "delete", id });
      },

      async deleteArchivedChanges() {
        const archived = latest.current.filter((change) => change.arquivadaEm);
        const attachmentIds = archived.flatMap((change) =>
          (change.acoes ?? []).flatMap((action) =>
            (action.resolucaoAnexos ?? []).map((attachment) => attachment.id),
          ),
        );
        await deleteAttachments(attachmentIds);
        dispatch({ type: "deleteArchived" });
        return archived.length;
      },

      replaceAll,

      resetToSeed: () => replaceAll(createSeed()),
      };
    }, []);

  const value = useMemo(
    () => ({ changes, ...api }),
    [changes, api],
  );

  return (
    <ChangesContext.Provider value={value}>
      {children}
    </ChangesContext.Provider>
  );
}
