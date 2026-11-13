
import { blankAction, canArchiveChange, newId, simItems } from "../utils/changes";
import { ETAPA, PARECERES } from "../data/formulario";

export function evento(tipo, texto) {
  return {
    id: newId(),
    tipo,
    texto,
    em: new Date().toISOString(),
  };
}

const addEvento = (change, tipo, texto) => ({
  ...change,
  historico: [...(change.historico || []), evento(tipo, texto)],
});

const mapChange = (state, id, fn) =>
  state.map((c) => (c.id === id ? fn(c) : c));

export function changesReducer(state, action) {
  switch (action.type) {
    case "add":
      return [
        ...state,
        {
          ...action.change,
          historico: [evento("criada", "Mudança registrada.")],
        },
      ];

    case "update":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            ...action.data,
            eficacia: {
              ...c.eficacia,
              ...action.data.eficacia,
            },
          },
          "editada",
          "Registro editado."
        )
      );

    case "completeAction":
      return mapChange(state, action.id, (c) => {
        const alvo = c.acoes.find((a) => a.id === action.actionId);
        if (!alvo) return c;

        return addEvento(
          {
            ...c,
            acoes: c.acoes.map((a) =>
              a.id === alvo.id
                ? { ...a, termino: action.date }
                : a
            ),
          },
          "acao",
          `Ação concluída: ${alvo.acao}`
        );
      });

    case "reopenAction":
      return mapChange(state, action.id, (c) => {
        const alvo = c.acoes.find((a) => a.id === action.actionId);
        if (!alvo) return c;

        return addEvento(
          {
            ...c,
            acoes: c.acoes.map((a) =>
              a.id === alvo.id
                ? { ...a, termino: null }
                : a
            ),
          },
          "acao",
          `Ação reaberta: ${alvo.acao}`
        );
      });

    // Pessoa designada apresenta uma resolução para o plano.
    case "proposeResolution":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            acoes: c.acoes.map((a) =>
              a.id === action.actionId
                ? {
                    ...a,
                    resolucao: action.resolucao,
                    resolucaoEm: action.date,
                    resolucaoAnexos: [
                      ...(a.resolucaoAnexos ?? []),
                      ...(action.anexos ?? []),
                    ],
                    statusPlano: "aguardando_aprovacao",
                    avaliacao: null,
                  }
                : a
            ),
          },
          "resolucao",
          `Resolução proposta para a ação: ${
            c.acoes.find((a) => a.id === action.actionId)?.acao || ""
          }`
        )
      );

    // Criador do plano aprova a resolução.
    case "approvePlan":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            acoes: c.acoes.map((a) =>
              a.id === action.actionId
                ? {
                    ...a,
                    statusPlano: "aprovado",
                    avaliacao: {
                      status: "aprovado",
                      observacao: action.observacao || "",
                      data: action.date,
                      avaliador: action.avaliador || "",
                    },
                    termino: action.date,
                  }
                : a
            ),
          },
          "aprovacao_plano",
          "Resolução do plano de ação aprovada."
        )
      );

    // Criador do plano reprova e devolve para correção.
    case "rejectPlan":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            acoes: c.acoes.map((a) =>
              a.id === action.actionId
                ? {
                    ...a,
                    statusPlano: "correcao",
                    avaliacao: {
                      status: "reprovado",
                      observacao: action.observacao,
                      data: action.date,
                      avaliador: action.avaliador || "",
                    },
                    termino: null,
                  }
                : a
            ),
          },
          "reprovacao_plano",
          "Resolução reprovada e devolvida para correção."
        )
      );

    case "verifyEficacia":
      return mapChange(state, action.id, (c) => {
        const eficacia = {
          ...c.eficacia,
          responsavel: action.responsavel ?? c.eficacia?.responsavel ?? "",
          dataPrevista: action.dataPrevista ?? c.eficacia?.dataPrevista ?? "",
          dataReal: action.dataReal,
          eficaz: action.eficaz,
          observacao: action.observacao,
        };

        if (action.eficaz) {
          return addEvento(
            { ...c, etapa: ETAPA.CONCLUIDO, eficacia },
            "eficacia",
            "Eficácia verificada: eficaz. Mudança concluída.",
          );
        }

        const acoesAtuais = c.acoes ?? [];
        const cicloAnterior = {
          numero: c.ciclo ?? 1,
          acoes: acoesAtuais,
          eficacia,
        };
        const itensParaReplanejar = simItems(c);
        const referencias = itensParaReplanejar.length
          ? itensParaReplanejar
          : acoesAtuais.map(({ checklist, item }) => ({ checklist, item }));
        const unicas = [...new Map(
          referencias.map((referencia) => [
            `${referencia.checklist ?? ""}:${referencia.item ?? ""}`,
            referencia,
          ]),
        ).values()];

        return addEvento(
          {
            ...c,
            etapa: ETAPA.PROPOSTA,
            ciclo: (c.ciclo ?? 1) + 1,
            ciclos: [...(c.ciclos ?? []), cicloAnterior],
            acoes: unicas.map((referencia) => blankAction(referencia.checklist, referencia.item)),
            eficacia: {
              responsavel: "",
              dataPrevista: "",
              dataReal: null,
              eficaz: null,
              observacao: "",
            },
          },
          "eficacia",
          `Eficácia não confirmada. O processo voltou ao planejamento para iniciar o ciclo ${(c.ciclo ?? 1) + 1}.`,
        );
      });

    case "reopenEficacia":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            eficacia: {
              ...c.eficacia,
              dataReal: null,
              eficaz: null,
            },
          },
          "eficacia",
          "Ciclo reaberto para nova verificação de eficácia."
        )
      );

    case "archive":
      return mapChange(state, action.id, (c) =>
        c.arquivadaEm || !canArchiveChange(c)
          ? c
          : addEvento(
              { ...c, arquivadaEm: action.date },
              "arquivada",
              `Mudança arquivada por ${action.por}.`,
            )
      );

    case "restoreArchive":
      return mapChange(state, action.id, (c) =>
        !c.arquivadaEm
          ? c
          : addEvento(
              { ...c, arquivadaEm: null },
              "desarquivada",
              `Mudança restaurada do arquivo por ${action.por}.`,
            )
      );

    case "approve":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            aprovacao: {
              aprovada: true,
              data: action.date,
            },
          },
          "aprovacao",
          `Mudança aprovada por ${c.aprovador}.`
        )
      );

    case "revokeApproval":
      return mapChange(state, action.id, (c) =>
        addEvento(
          {
            ...c,
            aprovacao: {
              aprovada: false,
              data: null,
            },
          },
          "aprovacao",
          "Aprovação removida."
        )
      );

    case "concluirAnalise":
      return mapChange(state, action.id, (c) => {
        const base = {
          ...c,
          impacto: action.impacto,
          parecer: action.parecer,
        };

        // parecer "Reprovar" cancela a mudança
        if (action.parecer.decisao === "reprovar") {
          return addEvento(
            { ...base, etapa: ETAPA.CANCELADA },
            "analise",
            `Mudança reprovada por ${action.por}. Mudança cancelada.`,
          );
        }

        // cada item "Sim" vira uma ação a detalhar (se ainda não existir)
        const novas = simItems(base)
          .filter((s) => !base.acoes.some((a) => a.checklist === s.checklist && a.item === s.item))
          .map((s) => blankAction(s.checklist, s.item));

        const parecer = PARECERES.find((p) => p.value === action.parecer.decisao)?.label ?? "—";

        return addEvento(
          { ...base, etapa: ETAPA.PROPOSTA, acoes: [...base.acoes, ...novas] },
          "analise",
          `Análise SGI concluída por ${action.por}. Parecer: ${parecer}. ${novas.length} ação(ões) a detalhar.`,
        );
      });


    case "delete":
      return state.filter((c) => c.id !== action.id || !c.arquivadaEm);

    case "deleteArchived":
      return state.filter((c) => !c.arquivadaEm);

    case "replaceAll":
      return action.changes;

    default:
      return state;
  }
}
