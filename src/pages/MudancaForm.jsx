import { Fragment, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Save, Trash2 } from "lucide-react";

import { useChanges } from "../hooks/useChanges";
import { CHECKLISTS, CHECKLIST_KEYS, itemLabel } from "../data/checklists";
import {
  actionRef,
  blankAction,
  blankChange,
  buildPayload,
  parseRef,
  simItems,
  simWithoutAction,
  validateChange,
} from "../utils/changes";
import "../styles/ui.css";

function MudancaForm() {
  const { id } = useParams();
  const { changes } = useChanges();
  const existing = id ? changes.find((c) => c.id === id) : null;

  if (id && !existing) {
    return (
      <div className="card empty">
        <h3>Mudança não encontrada</h3>
        <p>
          <Link to="/mudancas">Voltar para a lista</Link>
        </p>
      </div>
    );
  }

  // key força um estado novo quando troca de "nova" para "editar" (sem useEffect)
  return <FormBody key={id ?? "nova"} existing={existing} />;
}

function toForm(existing) {
  const base = blankChange();
  const copy = structuredClone(existing);
  return {
    ...base,
    ...copy,
    checklists: { ...base.checklists, ...copy.checklists },
    respostas: { ...base.respostas, ...copy.respostas },
    eficacia: { ...base.eficacia, ...copy.eficacia },
    outros: { ...base.outros, ...copy.outros },
  };
}

function FormBody({ existing }) {
  const navigate = useNavigate();
  const { addChange, updateChange } = useChanges();
  const [form, setForm] = useState(() => (existing ? toForm(existing) : blankChange()));
  const [errors, setErrors] = useState([]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleChecklist = (key) =>
    setForm((f) => ({ ...f, checklists: { ...f.checklists, [key]: !f.checklists[key] } }));

  const setAnswer = (key, n, value) =>
    setForm((f) => ({
      ...f,
      respostas: { ...f.respostas, [key]: { ...f.respostas[key], [n]: value } },
    }));

  const markAll = (key, value) =>
    setForm((f) => ({
      ...f,
      respostas: {
        ...f.respostas,
        [key]: Object.fromEntries(CHECKLISTS[key].items.map((i) => [i.n, value])),
      },
    }));

  const setEficacia = (field, value) =>
    setForm((f) => ({ ...f, eficacia: { ...f.eficacia, [field]: value } }));

  const setOutros = (key, value) =>
    setForm((f) => ({ ...f, outros: { ...f.outros, [key]: value } }));

  const addAction = (checklist = null, item = null) =>
    setForm((f) => ({ ...f, acoes: [...f.acoes, blankAction(checklist, item)] }));

  const patchAction = (actionId, patch) =>
    setForm((f) => ({
      ...f,
      acoes: f.acoes.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
    }));

  const removeAction = (actionId) =>
    setForm((f) => ({ ...f, acoes: f.acoes.filter((a) => a.id !== actionId) }));

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateChange(form);
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // id e histórico são controlados pelo provider/reducer
    // eslint-disable-next-line no-unused-vars
    const { id: _id, historico: _historico, ...payload } = buildPayload(form);

    if (existing) {
      updateChange(existing.id, payload);
      navigate(`/mudancas/${existing.id}`);
    } else {
      const novoId = addChange(payload);
      navigate(`/mudancas/${novoId}`);
    }
  }

  const sims = simItems(form);
  const semAcao = simWithoutAction(form);

  // opções do vínculo da ação: geral + itens "Sim" (+ vínculo atual, se a resposta mudou depois)
  const refOptions = (acao) => {
    const opts = [{ value: "geral", label: "Geral" }];
    sims.forEach((s) =>
      opts.push({ value: `${s.checklist}:${s.item}`, label: itemLabel(s.checklist, s.item) }),
    );
    const atual = actionRef(acao);
    if (!opts.some((o) => o.value === atual)) {
      opts.push({ value: atual, label: itemLabel(acao.checklist, acao.item) });
    }
    return opts;
  };

  return (
    <form className="page" onSubmit={handleSubmit} noValidate>
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>{existing ? `Editar ${existing.id}` : "Nova mudança"}</h1>
          <p>Preencha os checklists e o plano de ações conforme o Manual SGI-75-001.</p>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="form-errors" role="alert">
          <strong>Corrija os pontos abaixo:</strong>
          <ul>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <h2>Identificação</h2>
        <p className="card-sub">Dados gerais da mudança.</p>
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="titulo">Título da mudança</label>
            <input id="titulo" className="input" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div className="field span-2">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              className="input"
              rows={3}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="elaborador">Elaborador</label>
            <input id="elaborador" className="input" value={form.elaborador} onChange={(e) => set("elaborador", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="aprovador">Aprovador</label>
            <input id="aprovador" className="input" value={form.aprovador} onChange={(e) => set("aprovador", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="data">Data</label>
            <input id="data" type="date" className="input" value={form.data} onChange={(e) => set("data", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Checklists aplicáveis</h2>
        <p className="card-sub">Selecione quais avaliações se aplicam a esta mudança.</p>
        <div className="toggle-cards">
          {CHECKLIST_KEYS.map((k) => (
            <label key={k} className="toggle-card">
              <input type="checkbox" checked={Boolean(form.checklists[k])} onChange={() => toggleChecklist(k)} />
              {CHECKLISTS[k].short}
            </label>
          ))}
        </div>

        <div className="toggle-cards" style={{ marginTop: 16 }}>
          <label className="toggle-card">
            <input
              type="checkbox"
              checked={form.riscoSignificativo}
              onChange={(e) => set("riscoSignificativo", e.target.checked)}
            />
            Risco significativo (requer especialista)
          </label>
        </div>
        {form.riscoSignificativo && (
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="especialista">Especialista consultado</label>
            <input id="especialista" className="input" value={form.especialista} onChange={(e) => set("especialista", e.target.value)} />
          </div>
        )}
      </section>

      {CHECKLIST_KEYS.filter((k) => form.checklists[k]).map((k) => (
        <section className="card" key={k}>
          <h2>{CHECKLISTS[k].title}</h2>
          <p className="card-sub">Verificar se a mudança…</p>
          <div className="page-actions no-print" style={{ marginBottom: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => markAll(k, "nao")}>
              Marcar tudo como Não
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => markAll(k, "sim")}>
              Marcar tudo como Sim
            </button>
          </div>
          <div className="checklist">
            {CHECKLISTS[k].items.map((item) => (
              <Fragment key={item.n}>
                <div className="check-row">
                  <span className="check-n">{item.n}</span>
                  <span className="check-text">{item.text}</span>
                  <div className="check-options">
                    <label className="pill-radio">
                      <input
                        type="radio"
                        name={`${k}-${item.n}`}
                        checked={form.respostas[k]?.[item.n] === "sim"}
                        onChange={() => setAnswer(k, item.n, "sim")}
                      />
                      <span className="yes">Sim</span>
                    </label>
                    <label className="pill-radio">
                      <input
                        type="radio"
                        name={`${k}-${item.n}`}
                        checked={form.respostas[k]?.[item.n] === "nao"}
                        onChange={() => setAnswer(k, item.n, "nao")}
                      />
                      <span className="no">Não</span>
                    </label>
                  </div>
                </div>

                {item.outros && form.respostas[k]?.[item.n] === "sim" && (
                  <div className="field" style={{ padding: "0 0 12px 46px" }}>
                    <input
                      className="input"
                      placeholder="Descreva o item"
                      aria-label={`Descrição do item ${item.n}`}
                      value={form.outros?.[k] ?? ""}
                      onChange={(e) => setOutros(k, e.target.value)}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      ))}

      <section className="card">
        <h2>Acompanhamento da mudança</h2>
        <p className="card-sub">
          Para todas as respostas "Sim" e para as ações necessárias à mudança, registre ação, responsável e prazo.
        </p>

        {semAcao.length > 0 && (
          <div className="chip-row">
            {semAcao.map((s) => (
              <button
                type="button"
                key={`${s.checklist}:${s.item}`}
                className="chip"
                onClick={() => addAction(s.checklist, s.item)}
                title="Adicionar ação para este item"
              >
                <Plus size={12} /> {itemLabel(s.checklist, s.item)} sem ação
              </button>
            ))}
          </div>
        )}

        {form.acoes.length === 0 && <p className="hint">Nenhuma ação cadastrada.</p>}

        {form.acoes.map((a, i) => (
          <div className="action-edit-row" key={a.id}>
            <div className="field">
              <select
                className="input"
                aria-label={`Vínculo da ação ${i + 1}`}
                value={actionRef(a)}
                onChange={(e) => patchAction(a.id, parseRef(e.target.value))}
              >
                {refOptions(a).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="input"
              placeholder="Ação"
              aria-label={`Descrição da ação ${i + 1}`}
              value={a.acao}
              onChange={(e) => patchAction(a.id, { acao: e.target.value })}
            />
            <input
              className="input"
              placeholder="Responsável"
              aria-label={`Responsável da ação ${i + 1}`}
              value={a.responsavel}
              onChange={(e) => patchAction(a.id, { responsavel: e.target.value })}
            />
            <input
              type="date"
              className="input"
              aria-label={`Prazo da ação ${i + 1}`}
              value={a.prazo}
              onChange={(e) => patchAction(a.id, { prazo: e.target.value })}
            />
            <input
              type="date"
              className="input"
              aria-label={`Término da ação ${i + 1}`}
              value={a.termino ?? ""}
              onChange={(e) => patchAction(a.id, { termino: e.target.value || null })}
            />
            <button
              type="button"
              className="btn btn-danger btn-icon"
              aria-label={`Remover ação ${i + 1}`}
              onClick={() => removeAction(a.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addAction()}>
            <Plus size={14} /> Adicionar ação
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Verificação de eficácia</h2>
        <p className="card-sub">
          Análise crítica da mudança (prazo máximo: 6 meses após a implementação da última ação).
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="ef-resp">Responsável</label>
            <input
              id="ef-resp"
              className="input"
              value={form.eficacia.responsavel}
              onChange={(e) => setEficacia("responsavel", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ef-prev">Data prevista</label>
            <input
              id="ef-prev"
              type="date"
              className="input"
              value={form.eficacia.dataPrevista ?? ""}
              onChange={(e) => setEficacia("dataPrevista", e.target.value)}
            />
            <span className="hint">Em branco: usa o prazo máximo de 6 meses após a última ação.</span>
          </div>
        </div>
      </section>

      <div className="page-actions">
        <button type="submit" className="btn btn-primary">
          <Save size={16} /> {existing ? "Salvar alterações" : "Registrar mudança"}
        </button>
        <Link to={existing ? `/mudancas/${existing.id}` : "/mudancas"} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export default MudancaForm;
