import { Fragment, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { ETAPA } from "../data/formulario";
import { CHECKLISTS, CHECKLIST_KEYS, itemLabel, itemText } from "../data/checklists";
import {
  blankAction,
  blankChange,
  buildPayload,
  deriveStatus,
  STATUS,
  simItems,
  simWithoutAction,
  validateActionPlanning,
  validateChangeOpening,
} from "../utils/changes";
import "../styles/ui.css";

const TITULOS_MUDANCA = ["Simulação A", "Simulação B", "Simulação C", "Simulação D"];

function MudancaForm({ change: embeddedChange = null, onSaved, onCancel }) {
  const { id } = useParams();
  const { changes } = useChanges();
  const existing = embeddedChange ?? (id ? changes.find((c) => c.id === id) : null);

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

  if (existing?.arquivadaEm) {
    return (
      <div className="card empty">
        <h3>Esta mudança está arquivada</h3>
        <p>Registros arquivados ficam disponíveis somente para consulta.</p>
        <p>
          <Link to={`/mudancas/${existing.id}`}>Voltar para a mudança</Link>
        </p>
      </div>
    );
  }

  const isPlanning = Boolean(existing) && (
    existing.etapa
      ? existing.etapa === ETAPA.PROPOSTA
      : deriveStatus(existing) === STATUS.PLANEJAMENTO ||
        simWithoutAction(existing).length > 0 ||
        validateActionPlanning(existing).length > 0
  );

  if (existing && !isPlanning) {
    return (
      <div className="card empty">
        <h3>Esta mudança não está na etapa de planejamento</h3>
        <p>O formulário de edição fica disponível somente durante a etapa de planejamento.</p>
        <p>
          <Link to={`/mudancas/${existing.id}`}>Voltar para a mudança</Link>
        </p>
      </div>
    );
  }

  // key força um estado novo quando troca de "nova" para "editar" (sem useEffect)
  return (
    <FormBody
      key={existing?.id ?? id ?? "nova"}
      existing={existing}
      isPlanning={isPlanning}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}

function toForm(existing) {
  const base = blankChange();
  const copy = structuredClone(existing);
  const acoes = copy.acoes ?? [];
  const planosFaltantes = simItems(copy)
    .filter((sim) => !acoes.some((acao) => acao.checklist === sim.checklist && acao.item === sim.item))
    .map((sim) => blankAction(sim.checklist, sim.item));
  return {
    ...base,
    ...copy,
    checklists: { ...base.checklists, ...copy.checklists },
    respostas: { ...base.respostas, ...copy.respostas },
    eficacia: { ...base.eficacia, ...copy.eficacia },
    outros: { ...base.outros, ...copy.outros },
    acoes: [...acoes, ...planosFaltantes],
  };
}

function FormBody({ existing, isPlanning, onSaved, onCancel }) {
  const navigate = useNavigate();
  const { usuarios } = useAuth();
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

  const setOutros = (key, value) =>
    setForm((f) => ({ ...f, outros: { ...f.outros, [key]: value } }));

  const patchAction = (actionId, patch) =>
    setForm((f) => ({
      ...f,
      acoes: f.acoes.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
    }));

  function handleSubmit(e) {
    e.preventDefault();
    const errs = isPlanning ? validateActionPlanning(form) : validateChangeOpening(form);
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
      if (onSaved) onSaved();
      else navigate(`/mudancas/${existing.id}`);
    } else {
      const novoId = addChange(payload);
      navigate(`/mudancas/${novoId}`);
    }
  }

  return (
    <form className="page" onSubmit={handleSubmit} noValidate>
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>{isPlanning ? `Planejamento — ${existing.id}` : "Nova mudança"}</h1>
          <p>
            {isPlanning
              ? 'Crie um plano de ação para cada item respondido como "Sim".'
              : "Registre a mudança e responda todos os itens dos checklists aplicáveis."}
          </p>
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

      {!isPlanning && (
        <>
      <section className="card">
        <h2>Identificação</h2>
        <p className="card-sub">Dados gerais da mudança.</p>
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="titulo">Título da mudança</label>
            <select id="titulo" className="input" value={form.titulo} onChange={(e) => set("titulo", e.target.value)}>
              <option value="">Selecione o título</option>
              {TITULOS_MUDANCA.map((titulo) => (
                <option key={titulo} value={titulo}>
                  {titulo}
                </option>
              ))}
            </select>
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
        </>
      )}

      {isPlanning && (
      <section className="card">
        <h2>Planos de ação · 5W2H</h2>
        <p className="card-sub">
          Um plano é criado automaticamente para cada pergunta marcada como “Sim” pelo cliente. Preencha os campos 5W2H.
        </p>

        {form.acoes.length === 0 && (
          <div className="notice info">O cliente não marcou perguntas como “Sim”; não há planos de ação a montar.</div>
        )}

        {form.acoes.map((a, i) => (
          <div className="action-plan-card" key={a.id}>
            <h3>Plano {i + 1} · {itemLabel(a.checklist, a.item, form)}</h3>
            <p className="hint">{itemText(a.checklist, a.item, form)}</p>
            {((a.checklist === "qualidade" && a.item === 11) ||
              (a.checklist === "sms" && a.item === 21)) &&
              form.outros?.[a.checklist] && (
                <p className="hint">Detalhe informado pelo cliente: {form.outros[a.checklist]}</p>
              )}
            <div className="form-grid">
              <div className="field span-2">
                <label htmlFor={`acao-${a.id}`}>O quê? Ação planejada *</label>
                <textarea
                  id={`acao-${a.id}`}
                  className="input"
                  rows={2}
                  value={a.acao ?? ""}
                  onChange={(e) => patchAction(a.id, { acao: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`porque-${a.id}`}>Por quê? *</label>
                <textarea
                  id={`porque-${a.id}`}
                  className="input"
                  rows={2}
                  value={a.porque ?? ""}
                  onChange={(e) => patchAction(a.id, { porque: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`onde-${a.id}`}>Onde? *</label>
                <input
                  id={`onde-${a.id}`}
                  className="input"
                  value={a.onde ?? ""}
                  onChange={(e) => patchAction(a.id, { onde: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`quando-${a.id}`}>Quando? Prazo *</label>
                <input
                  id={`quando-${a.id}`}
                  type="date"
                  className="input"
                  value={a.prazo ?? ""}
                  onChange={(e) => patchAction(a.id, { prazo: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`quem-${a.id}`}>Quem? Responsável *</label>
                <select
                  id={`quem-${a.id}`}
                  className="input"
                  value={a.responsavelId ?? ""}
                  onChange={(e) => {
                    const selecionado = usuarios.find((u) => u.usuario === e.target.value);
                    patchAction(a.id, {
                      responsavelId: selecionado?.usuario ?? "",
                      responsavel: selecionado?.nome ?? "",
                    });
                  }}
                  required
                >
                  <option value="">Selecione o responsável</option>
                  {usuarios.filter((u) => u.papel !== "admin").map((u) => (
                    <option key={u.usuario} value={u.usuario}>
                      {u.nome} — {u.usuario}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`como-${a.id}`}>Como? Método de execução *</label>
                <textarea
                  id={`como-${a.id}`}
                  className="input"
                  rows={2}
                  value={a.como ?? ""}
                  onChange={(e) => patchAction(a.id, { como: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`quanto-${a.id}`}>Quanto? Custo estimado *</label>
                <input
                  id={`quanto-${a.id}`}
                  className="input"
                  placeholder="R$ 0,00 ou Não se aplica"
                  value={a.quanto ?? ""}
                  onChange={(e) => patchAction(a.id, { quanto: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </section>
      )}

      <div className="page-actions">
        <button type="submit" className="btn btn-primary">
          <Save size={16} /> {isPlanning ? "Salvar planejamento" : "Registrar mudança"}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        ) : (
          <Link to={existing ? `/mudancas/${existing.id}` : "/mudancas"} className="btn btn-ghost">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}

export default MudancaForm;
