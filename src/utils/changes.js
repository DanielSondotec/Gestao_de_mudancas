// Regras de negócio da gestão de mudanças (Manual SGI-75-001, item 6.3 e Anexo II).
import { CHECKLIST_KEYS, CHECKLISTS } from "../data/checklists";
import { addDays, addMonths, formatDate, todayISO } from "./dates";

export const STATUS = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_EFICACIA: "Aguardando eficácia",
  CONCLUIDA: "Concluída",
  REVISAO: "Revisão necessária",
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
    acoes: [],
    eficacia: { responsavel: "", dataPrevista: "", dataReal: null, eficaz: null, observacao: "" },
  };
}

export function blankAction(checklist = null, item = null) {
  return { id: newId(), checklist, item, acao: "", responsavel: "", prazo: "", termino: null };
}

// ---------- referências "qualidade:3" | "sms:14" | "geral" ----------
export const actionRef = (a) => (a.checklist && a.item ? `${a.checklist}:${a.item}` : "geral");

export function parseRef(ref) {
  if (!ref || ref === "geral") return { checklist: null, item: null };
  const [checklist, n] = ref.split(":");
  return { checklist, item: Number(n) };
}

// ---------- consultas sobre uma mudança ----------

// Itens respondidos "Sim" nos checklists aplicados.
export function simItems(change) {
  const out = [];
  for (const key of CHECKLIST_KEYS) {
    if (!change.checklists?.[key]) continue;
    for (const item of CHECKLISTS[key].items) {
      if (change.respostas?.[key]?.[item.n] === "sim") out.push({ checklist: key, item: item.n });
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
  if (acao.termino) return "Concluída";
  return acao.prazo && acao.prazo < hoje ? "Atrasada" : "Pendente";
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
  const datas = change.acoes.flatMap((a) => [a.prazo, a.termino]).filter(Boolean);
  const referencia = datas.length ? datas.reduce((a, b) => (a > b ? a : b)) : change.data;
  return referencia ? addMonths(referencia, 6) : null;
}

export function eficaciaAtrasada(change, hoje = todayISO()) {
  const ef = change.eficacia;
  return Boolean(ef?.dataPrevista && !ef.dataReal && allActionsDone(change) && ef.dataPrevista < hoje);
}

// ---------- validação e montagem do payload do formulário ----------

export function validateChange(form) {
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

  form.acoes.forEach((a, i) => {
    if (!a.acao.trim() || !a.responsavel.trim() || !a.prazo) {
      errs.push(`Ação ${i + 1}: preencha a ação, o responsável e o prazo.`);
    }
  });

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
      responsavel: a.responsavel.trim(),
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
