import { useState } from "react";
import { CheckCheck } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { pode } from "../utils/permissoes";
import { blankChange, simItems } from "../utils/changes";
import { itemLabel, itemText } from "../data/checklists";
import {
  IMPACTO_TIPO,
  IMPACTO_NIVEIS,
  NIVEIS,
  PARECERES,
  nivelRisco,
} from "../data/formulario";
import "../styles/ui.css";

// Etapa 2 do fluxo: análise feita pelo SGI (gestor).
function AnaliseSGI({ change }) {
  const { user } = useAuth();
  const { concluirAnalise } = useChanges();

  const [form, setForm] = useState(() => {
    const base = blankChange().impacto;
    return {
      impacto: {
        ...base,
        ...change.impacto,
        niveis: { ...base.niveis, ...change.impacto?.niveis },
        porTipo: { ...change.impacto?.porTipo },
      },
      parecer: { decisao: "", justificativa: "", ...change.parecer },
    };
  });
  const [errors, setErrors] = useState([]);
  const itensSim = simItems(change);

  // atualiza um valor aninhado: upd("impacto.niveis.receita", "Alto")
  const upd = (caminho, valor) =>
    setForm((f) => {
      const novo = structuredClone(f);
      const chaves = caminho.split(".");
      let alvo = novo;
      while (chaves.length > 1) alvo = alvo[chaves.shift()];
      alvo[chaves[0]] = valor;
      return novo;
    });

  if (!pode(user, "detalharPlano")) {
    return (
      <div className="notice info">
        Etapa <strong>Análise SGI</strong>: aguardando análise de impacto e parecer do gestor.
      </div>
    );
  }

  const risco = nivelRisco(form.impacto.severidade, form.impacto.probabilidade);

  function validar() {
    const errs = [];
    if (!form.impacto.severidade || !form.impacto.probabilidade) {
      errs.push("Informe a severidade e a probabilidade.");
    }
    if (!form.parecer.decisao) errs.push("Informe o parecer do gestor.");
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validar();
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (
      form.parecer.decisao === "reprovar" &&
      !window.confirm("Reprovar cancela esta mudança. Deseja continuar?")
    ) {
      return;
    }

    concluirAnalise(change.id, {
      impacto: form.impacto,
      parecer: { ...form.parecer, justificativa: form.parecer.justificativa.trim() },
      por: user.nome,
    });
  }

  return (
    <form className="page" onSubmit={handleSubmit} noValidate>
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
        <h2>Respostas do solicitante</h2>
        <p className="card-sub">
          Consulte somente as perguntas marcadas como “Sim” pelo cliente. Cada uma terá um plano de ação na próxima etapa.
        </p>
        {itensSim.length === 0 ? (
          <div className="empty">O cliente não marcou perguntas como “Sim”.</div>
        ) : (
          <ul className="readonly-answers">
            {itensSim.map((item) => (
              <li key={`${item.checklist}:${item.item}`}>
                <strong>{itemLabel(item.checklist, item.item, change)}</strong>
                <span>{itemText(item.checklist, item.item, change)}</span>
                {item.checklist !== "comp" &&
                  (item.item === 11 && item.checklist === "qualidade" ||
                    item.item === 21 && item.checklist === "sms") &&
                  change.outros?.[item.checklist] && (
                    <small>Detalhe informado pelo cliente: {change.outros[item.checklist]}</small>
                  )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Análise de impacto no negócio</h2>
        <p className="card-sub">Preenchida pelo SGI com o gestor do processo.</p>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="contratos">Contratos e clientes afetados</label>
            <input id="contratos" className="input" value={form.impacto.contratos} onChange={(e) => upd("impacto.contratos", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="prazoDias">Prazo de impacto no cronograma (dias)</label>
            <input id="prazoDias" type="number" className="input" value={form.impacto.prazoDias} onChange={(e) => upd("impacto.prazoDias", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="custoUnico">Custo único estimado (R$)</label>
            <input id="custoUnico" type="number" className="input" value={form.impacto.custoUnico} onChange={(e) => upd("impacto.custoUnico", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="custoRec">Custo recorrente mensal (R$)</label>
            <input id="custoRec" type="number" className="input" value={form.impacto.custoRecorrente} onChange={(e) => upd("impacto.custoRecorrente", e.target.value)} />
          </div>

          {IMPACTO_NIVEIS.map(([campo, rotulo]) => (
            <div className="field" key={campo}>
              <label htmlFor={`nivel-${campo}`}>{rotulo}</label>
              <select
                id={`nivel-${campo}`}
                className="input"
                value={form.impacto.niveis[campo]}
                onChange={(e) => upd(`impacto.niveis.${campo}`, e.target.value)}
              >
                <option value="">Selecione</option>
                {NIVEIS.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          ))}

          {(change.tipos ?? []).flatMap((k) =>
            IMPACTO_TIPO[k].map((pergunta, j) => (
              <div className="field" key={`${k}${j}`}>
                <label htmlFor={`pt-${k}${j}`}>{pergunta}</label>
                <input
                  id={`pt-${k}${j}`}
                  className="input"
                  value={form.impacto.porTipo[`${k}${j}`] ?? ""}
                  onChange={(e) => upd(`impacto.porTipo.${k}${j}`, e.target.value)}
                />
              </div>
            )),
          )}

          <div className="field">
            <label htmlFor="sev">Severidade (1–5) *</label>
            <select id="sev" className="input" value={form.impacto.severidade} onChange={(e) => upd("impacto.severidade", e.target.value)}>
              <option value="">Selecione</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="prob">Probabilidade (1–5) *</label>
            <select id="prob" className="input" value={form.impacto.probabilidade} onChange={(e) => upd("impacto.probabilidade", e.target.value)}>
              <option value="">Selecione</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field span-2">
            <span className="label">Nível de risco da mudança</span>
            <strong>{risco.valor ? `${risco.valor} · ${risco.nivel}` : "—"}</strong>
          </div>

          <div className="field span-2">
            <label htmlFor="rev">Plano de reversão se a mudança falhar</label>
            <textarea id="rev" className="input" rows={3} value={form.impacto.reversao} onChange={(e) => upd("impacto.reversao", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Parecer do gestor</h2>
        <p className="card-sub">"Reprovar" cancela a mudança.</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="parecer">Parecer *</label>
            <select id="parecer" className="input" value={form.parecer.decisao} onChange={(e) => upd("parecer.decisao", e.target.value)}>
              <option value="">Selecione</option>
              {PARECERES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="just">Justificativa do parecer</label>
            <textarea id="just" className="input" rows={3} value={form.parecer.justificativa} onChange={(e) => upd("parecer.justificativa", e.target.value)} />
          </div>
        </div>
      </section>

      <div className="page-actions">
        <button type="submit" className="btn btn-primary">
          <CheckCheck size={16} /> Concluir análise
        </button>
      </div>
    </form>
  );
}

export default AnaliseSGI;