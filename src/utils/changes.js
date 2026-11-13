// Regras de negócio da gestão de mudanças (Manual SGI-75-001, item 6.3 e Anexo II).
import { CHECKLIST_KEYS, CHECKLISTS, itemLabel } from "../data/checklists";
import { addDays, addMonths, formatDate, todayISO } from "./dates";
import { ETAPA, gruposComplementares } from "../data/formulario";

export const STATUS = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_EFICACIA: "Aguardando eficácia",
  CONCLUIDA: "Concluída",
  REVISAO: "Revisão necessária",
};

export const RESUMO_STATUS = {
  ABERTURA: "Abertura",
  ANALISE: "Análise SGI",
  PROPOSTA: "Proposta de ação",
  EXECUCAO: "Execução",
  EFICACIA: "Aguardando eficácia",
  CONCLUIDA: "Concluída",
  REVISAO: "Revisão necessária",
  CANCELADA: "Cancelada",
  ATRASADA: "Atrasada",
};

export const ACTION_STATUS = {
  ABERTA: "Aberta",
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  PLANO_APROVADO: "Plano aprovado",
  CORRECAO: "Correção solicitada",
  EXECUTADA: "Executada",
  ATRASADA: "Atrasada",
};

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// SGI-GMU-AAAA-NN, sequência reiniciada a cada ano (mesmo padrão do arquivo SGI-GMU-2026-04).
export function nextChangeId(changes, year) {
  const re = new RegExp(`^SGI-GMU-${year}-(\\d+)$`);
  const max = changes.reduce((acc, c) => {
    const m = re.exec(c.id);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 0);
  return `SGI-GMU-${year}-${String(max + 1).padStart(2, "0")}`;
}

export function blankChange() {
  return {
    titulo: "",
    descricao: "",
    elaborador: "",
    aprovador: "",
    data: todayISO(),
    checklists: { qualidade: true, sms: true },
    respostas: { qualidade: {}, sms: {} },
    riscoSignificativo: false,
    especialista: "",
    outros: { qualidade: "", sms: "" },
        // ---- novo fluxo (baseado no protótipo do SGI) ----
    etapa: ETAPA.ABERTURA,
    ciclo: 1,
    ciclos: [],

    // 1) Abertura (cliente). "descricao" já existe e responde "O que muda?"
    solicitante: "",
    gestorProcesso: "",
    area: "",
    motivo: "",
    semFazer: "",
    tipos: [],
    dataPrevista: "",
    temporaria: false,
    dataFim: "",
    naoIntencional: false,
    requisitoLegal: false,
    quimico: false,
    terceiros: false,

    // 2) Análise SGI (gestor)
    complementares: {},
    impacto: {
      contratos: "",
      prazoDias: "",
      custoUnico: "",
      custoRecorrente: "",
      niveis: { receita: "", cliente: "", legal: "", sma: "", rep: "", cert: "" },
      porTipo: {},
      severidade: "",
      probabilidade: "",
      reversao: "",
    },
    parecer: { decisao: "", justificativa: "" },
    acoes: [],
    eficacia: { responsavel: "", dataPrevista: "", dataReal: null, eficaz: null, observacao: "" },
  };
}

export function blankAction(checklist = null, item = null) {
  return {
    id: newId(),
    checklist,
    item,
    acao: "",
    porque: "",
    onde: "",
    responsavel: "",
    prazo: "",
    como: "",
    quanto: "",
    termino: null,
  };
}

// ---------- referências "qualidade:3" | "sms:14" | "comp:loc1" | "geral" ----------
export const actionRef = (a) => (a.checklist && a.item ? `${a.checklist}:${a.item}` : "geral");

export function parseRef(ref) {
  if (!ref || ref === "geral") return { checklist: null, item: null };
  const [checklist, n] = ref.split(":");
  return { checklist, item: checklist === "comp" ? n : Number(n) };
}

// ---------- consultas sobre uma mudança ----------

// Itens respondidos "Sim" nos checklists principais e complementares.
export function simItems(change) {
  const out = [];
  for (const key of CHECKLIST_KEYS) {
    if (!change.checklists?.[key]) continue;
    for (const item of CHECKLISTS[key].items) {
      if (change.respostas?.[key]?.[item.n] === "sim") out.push({ checklist: key, item: item.n });
    }
  }
  for (const grupo of gruposComplementares(change)) {
    for (const item of grupo.itens) {
      if (change.complementares?.[item.id] === "sim") {
        out.push({ checklist: "comp", item: item.id });
      }
    }
  }
  return out;
}

// Itens "Sim" que ainda não têm nenhuma ação vinculada (alerta, não bloqueia).
export function simWithoutAction(change) {
  return simItems(change).filter(
    (s) => !change.acoes.some((a) => a.checklist === s.checklist && a.item === s.item),
  );
}

export function acaoStatus(acao, hoje = todayISO()) {
  if (acao.termino) return ACTION_STATUS.EXECUTADA;
  return acao.prazo && acao.prazo < hoje ? ACTION_STATUS.ATRASADA : ACTION_STATUS.ABERTA;
}

export function acaoResumoStatus(acao, hoje = todayISO()) {
  if (acao.statusPlano === "correcao") return ACTION_STATUS.CORRECAO;
  if (acao.statusPlano === "aguardando_aprovacao" || acao.resolucaoEm) {
    return ACTION_STATUS.AGUARDANDO_AVALIACAO;
  }
  if (acao.statusPlano === "aprovado") return ACTION_STATUS.PLANO_APROVADO;
  if (acao.termino) return ACTION_STATUS.EXECUTADA;
  return acao.prazo && acao.prazo < hoje ? ACTION_STATUS.ATRASADA : ACTION_STATUS.ABERTA;
}

// Status da mudança; "Concluída" é reservado para eficácia confirmada.
export function deriveSummaryStatus(change, hoje = todayISO()) {
  if (change.etapa === ETAPA.CANCELADA) return RESUMO_STATUS.CANCELADA;

  if (change.eficacia?.dataReal && change.eficacia.eficaz === true) {
    return RESUMO_STATUS.CONCLUIDA;
  }
  if (change.eficacia?.dataReal && change.eficacia.eficaz === false) {
    return RESUMO_STATUS.REVISAO;
  }

  const acoes = change.acoes ?? [];
  const hasOverdueExecution = acoes.some(
    (acao) =>
      !acao.termino &&
      acao.statusPlano !== "aguardando_aprovacao" &&
      Boolean(acao.prazo) &&
      acao.prazo < hoje,
  );
  if (hasOverdueExecution) return RESUMO_STATUS.ATRASADA;

  if (change.etapa === ETAPA.ABERTURA) return RESUMO_STATUS.ABERTURA;
  if (change.etapa === ETAPA.ANALISE) return RESUMO_STATUS.ANALISE;
  if (change.etapa === ETAPA.EFICACIA) return RESUMO_STATUS.EFICACIA;
  if (change.etapa === ETAPA.EXECUCAO) {
    return canVerifyEficacia(change) ? RESUMO_STATUS.EFICACIA : RESUMO_STATUS.EXECUCAO;
  }
  if (change.etapa === ETAPA.PROPOSTA) {
    return canVerifyEficacia(change) ? RESUMO_STATUS.EFICACIA : RESUMO_STATUS.PROPOSTA;
  }
  if (change.etapa === ETAPA.CONCLUIDO) return RESUMO_STATUS.EFICACIA;

  if (acoes.length && canVerifyEficacia(change)) return RESUMO_STATUS.EFICACIA;
  if (acoes.length) {
    return acoes.some((acao) => acao.statusPlano === "aprovado")
      ? RESUMO_STATUS.EXECUCAO
      : RESUMO_STATUS.PROPOSTA;
  }
  return simItems(change).length ? RESUMO_STATUS.PROPOSTA : RESUMO_STATUS.ANALISE;
}

export function canArchiveChange(change) {
  const status = deriveSummaryStatus(change);
  return status === RESUMO_STATUS.CONCLUIDA || status === RESUMO_STATUS.CANCELADA;
}

// Ação aberta, ainda no prazo, que vence nos próximos `dias` dias.
export function venceEmBreve(acao, dias = 7, hoje = todayISO()) {
  return (
    !acao.termino &&
    Boolean(acao.prazo) &&
    acao.prazo >= hoje &&
    acao.prazo <= addDays(hoje, dias)
  );
}

export const allActionsDone = (change) => change.acoes.every((a) => a.termino);

export function canVerifyEficacia(change) {
  return allActionsDone(change) && !change.eficacia?.dataReal;
}

// Status derivado do ciclo do Anexo II: planejar → ações → verificar eficácia.
export function deriveStatus(change) {
  const ef = change.eficacia;
  if (ef?.dataReal) return ef.eficaz ? STATUS.CONCLUIDA : STATUS.REVISAO;
  if (change.acoes.length === 0) {
    return simItems(change).length > 0 ? STATUS.PLANEJAMENTO : STATUS.AGUARDANDO_EFICACIA;
  }
  return allActionsDone(change) ? STATUS.AGUARDANDO_EFICACIA : STATUS.EM_ANDAMENTO;
}

// Manual 6.3: eficácia validada em até 6 meses após concluídas todas as ações.
export function maxEficaciaDate(change) {
  const datas = (change.acoes ?? []).map((a) => a.termino).filter(Boolean);
  if (!datas.length && (change.acoes ?? []).length > 0) return null;

  const referencia = datas.length
    ? datas.reduce((a, b) => (a > b ? a : b))
    : change.data;
  return referencia ? addMonths(referencia, 6) : null;
}

export function eficaciaAtrasada(change, hoje = todayISO()) {
  const ef = change.eficacia;
  return Boolean(ef?.dataPrevista && !ef.dataReal && allActionsDone(change) && ef.dataPrevista < hoje);
}

// ---------- validação e montagem do payload do formulário ----------

function validateOpeningFields(form) {
  const errs = [];
  if (!form.titulo.trim()) errs.push("Informe o título da mudança.");
  if (!form.elaborador.trim()) errs.push("Informe o elaborador.");
  if (!form.aprovador.trim()) errs.push("Informe o aprovador.");
  if (!form.data) errs.push("Informe a data da mudança.");

  const enabled = CHECKLIST_KEYS.filter((k) => form.checklists[k]);
  if (enabled.length === 0) errs.push("Selecione ao menos um checklist (Qualidade e/ou SMS).");
  for (const k of enabled) {
    const missing = CHECKLISTS[k].items.filter((i) => !form.respostas[k]?.[i.n]).length;
    if (missing) errs.push(`Checklist ${CHECKLISTS[k].short}: ${missing} pergunta(s) sem resposta.`);
    const itemOutros = CHECKLISTS[k].items.find((i) => i.outros);
    if (itemOutros && form.respostas[k]?.[itemOutros.n] === "sim" && !form.outros?.[k]?.trim()) {
      errs.push(`Checklist ${CHECKLISTS[k].short}: descreva o item "Outros" (${itemOutros.n}).`);
    }
  }

  return errs;
}

function validateActionFields(acoes) {
  const errs = [];
  (acoes ?? []).forEach((a, i) => {
    if (
      !a.acao?.trim() ||
      !a.porque?.trim() ||
      !a.onde?.trim() ||
      !a.responsavel?.trim() ||
      !a.prazo ||
      !a.como?.trim() ||
      !a.quanto?.trim()
    ) {
      errs.push(`Plano ${i + 1}: preencha os campos do 5W2H.`);
    }
  });

  return errs;
}

function validateEficaciaFields(form) {
  const errs = [];
  if (!form.eficacia.responsavel.trim()) errs.push("Informe o responsável pela verificação de eficácia.");
  const prevista = form.eficacia.dataPrevista;
  if (prevista) {
    const max = maxEficaciaDate(form);
    if (form.data && prevista < form.data) {
      errs.push("A data prevista da verificação de eficácia não pode ser anterior à data da mudança.");
    } else if (max && prevista > max) {
      errs.push(`A eficácia deve ser verificada em até 6 meses após a última ação (máximo ${formatDate(max)}).`);
    }
  }

  return errs;
}

export function validateChangeOpening(form) {
  return validateOpeningFields(form);
}

export function validateActionPlanning(form) {
  const acoes = form.acoes ?? [];
  const errs = validateActionFields(acoes);
  for (const sim of simItems(form)) {
    const count = acoes.filter(
      (acao) => acao.checklist === sim.checklist && acao.item === sim.item,
    ).length;
    if (count !== 1) {
      errs.push(`${itemLabel(sim.checklist, sim.item, form)}: informe exatamente um plano para a resposta “Sim” (encontrados: ${count}).`);
    }
  }
  return errs;
}

export function validateChange(form) {
  return [
    ...validateOpeningFields(form),
    ...validateActionFields(form.acoes),
    ...validateEficaciaFields(form),
  ];
}

export function buildPayload(form) {
  const respostas = {};
  const checklists = {};
  for (const k of CHECKLIST_KEYS) {
    checklists[k] = Boolean(form.checklists[k]);
    respostas[k] = checklists[k] ? form.respostas[k] : {};
  }
  const outros = {};
  for (const k of CHECKLIST_KEYS) {
    outros[k] = checklists[k] ? (form.outros?.[k] ?? "").trim() : "";
  }
  const trimmed = {
    ...form,
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    elaborador: form.elaborador.trim(),
    aprovador: form.aprovador.trim(),
    especialista: form.riscoSignificativo ? form.especialista.trim() : "",
    checklists,
    respostas,
    outros,
    acoes: form.acoes.map((a) => ({
      ...a,
      acao: a.acao.trim(),
      porque: a.porque.trim(),
      onde: a.onde.trim(),
      responsavel: a.responsavel.trim(),
      como: a.como.trim(),
      quanto: a.quanto.trim(),
    })),
  };
  trimmed.eficacia = {
    ...form.eficacia,
    responsavel: form.eficacia.responsavel.trim(),
    // sem data informada, usa o prazo máximo permitido pelo manual
    dataPrevista: form.eficacia.dataPrevista || maxEficaciaDate(trimmed),
  };
  return trimmed;
}
