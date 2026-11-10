import { newId } from "../utils/changes";

export function evento(tipo, texto) {
  return { id: newId(), tipo, texto, em: new Date().toISOString() };
}

const addEvento = (change, tipo, texto) => ({
  ...change,
  historico: [...change.historico, evento(tipo, texto)],
});

const mapChange = (state, id, fn) => state.map((c) => (c.id === id ? fn(c) : c));

export function changesReducer(state, action) {
  switch (action.type) {
    case "add":
      return [
        ...state,
        { ...action.change, historico: [evento("criada", "Mudança registrada.")] },
      ];

    case "update":
      return mapChange(state, action.id, (c) =>
        addEvento(
          { ...c, ...action.data, eficacia: { ...c.eficacia, ...action.data.eficacia } },
          "editada",
          "Registro editado.",
        ),
      );

    case "completeAction":
      return mapChange(state, action.id, (c) => {
        const alvo = c.acoes.find((a) => a.id === action.actionId);
        if (!alvo) return c;
        return addEvento(
          { ...c, acoes: c.acoes.map((a) => (a.id === alvo.id ? { ...a, termino: action.date } : a)) },
          "acao",
          `Ação concluída: ${alvo.acao}`,
        );
      });

    case "reopenAction":
      return mapChange(state, action.id, (c) => {
        const alvo = c.acoes.find((a) => a.id === action.actionId);
        if (!alvo) return c;
        return addEvento(
          { ...c, acoes: c.acoes.map((a) => (a.id === alvo.id ? { ...a, termino: null } : a)) },
          "acao",
          `Ação reaberta: ${alvo.acao}`,
        );
      });

    case "verifyEficacia":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            eficacia: {
              ...c.eficacia,
              dataReal: action.dataReal,
              eficaz: action.eficaz,
              observacao: action.observacao,
            },
          },
          "eficacia",
          action.eficaz
            ? "Eficácia verificada: eficaz."
            : "Eficácia verificada: não eficaz — revisar planilha de aspectos/perigos.",
        ),
      );

    case "reopenEficacia":
      return mapChange(state, action.id, (c) =>
        addEvento(
          { ...c, eficacia: { ...c.eficacia, dataReal: null, eficaz: null } },
          "eficacia",
          "Ciclo reaberto para nova verificação de eficácia.",
        ),
      );

        case "approve":
      return mapChange(state, action.id, (c) =>
        addEvento(
          { ...c, aprovacao: { aprovada: true, data: action.date } },
          "aprovacao",
          `Mudança aprovada por ${c.aprovador}.`,
        ),
      );

    case "revokeApproval":
      return mapChange(state, action.id, (c) =>
        addEvento(
          { ...c, aprovacao: { aprovada: false, data: null } },
          "aprovacao",
          "Aprovação removida.",
        ),
      );

    case "delete":
      return state.filter((c) => c.id !== action.id);

    case "replaceAll":
      return action.changes;

    default:
      return state;
  }
}
