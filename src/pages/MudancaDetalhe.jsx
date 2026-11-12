import { Fragment, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { pode } from "../utils/permissoes";

import StatusBadge from "../components/StatusBadge";
import CompleteAction from "../components/CompleteAction";
import { useChanges } from "../hooks/useChanges";
import { CHECKLISTS, CHECKLIST_KEYS, itemLabel, itemText } from "../data/checklists";
import {
  acaoStatus,
  allActionsDone,
  canVerifyEficacia,
  deriveStatus,
  eficaciaAtrasada,
  simWithoutAction,
  venceEmBreve,
} from "../utils/changes";
import { formatDate, formatDateTime, todayISO } from "../utils/dates";
import "../styles/ui.css";

// Estado de cada etapa do ciclo: avaliação → ações → eficácia → conclusão.
function etapas(change) {
  const ef = change.eficacia;
  const acoesOk = allActionsDone(change);
  const verificada = Boolean(ef?.dataReal);
  return [
    { titulo: "1. Avaliação", texto: "Checklists respondidos", estado: "done" },
    {
      titulo: "2. Ações",
      texto: `${change.acoes.filter((a) => a.termino).length}/${change.acoes.length} concluídas`,
      estado: acoesOk ? "done" : "current",
    },
    {
      titulo: "3. Eficácia",
      texto: verificada ? `Verificada em ${formatDate(ef.dataReal)}` : `Prevista: ${formatDate(ef?.dataPrevista)}`,
      estado: verificada ? "done" : acoesOk ? "current" : "",
    },
    {
      titulo: "4. Conclusão",
      texto: verificada ? (ef.eficaz ? "Eficaz" : "Revisão necessária") : "Pendente",
      estado: verificada ? (ef.eficaz ? "done" : "bad") : "",
    },
  ];
}

function EficaciaForm({ changeId }) {
  const { verifyEficacia } = useChanges();
  const [dataReal, setDataReal] = useState(todayISO());
  const [eficaz, setEficaz] = useState(true);
  const [observacao, setObservacao] = useState("");

  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dataReal) return;
        verifyEficacia(changeId, { dataReal, eficaz, observacao: observacao.trim() });
      }}
    >
      <div className="field">
        <label htmlFor="ef-real">Data real da verificação</label>
        <input id="ef-real" type="date" className="input" value={dataReal} onChange={(e) => setDataReal(e.target.value)} />
      </div>
      <div className="field">
        <span className="label">A mudança atendeu aos resultados esperados?</span>
        <div className="toggle-cards">
          <label className="toggle-card">
            <input type="radio" name="eficaz" checked={eficaz} onChange={() => setEficaz(true)} /> Eficaz
          </label>
          <label className="toggle-card">
            <input type="radio" name="eficaz" checked={!eficaz} onChange={() => setEficaz(false)} /> Não eficaz
          </label>
        </div>
      </div>
      <div className="field span-2">
        <label htmlFor="ef-obs">Observação</label>
        <textarea id="ef-obs" className="input" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        {!eficaz && (
          <span className="hint">Não eficaz: revisar a planilha de aspectos/perigos.</span>
        )}
      </div>
      <div className="span-2">
        <button type="submit" className="btn btn-primary">
          Registrar verificação
        </button>
      </div>
    </form>
  );
}

function MudancaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { changes, deleteChange, reopenEficacia, approveChange, revokeApproval } = useChanges();
  const change = changes.find((c) => c.id === id);

  if (!change) {
    return (
      <div className="card empty">
        <h3>Mudança não encontrada</h3>
        <p>
          <Link to="/mudancas">Voltar para a lista</Link>
        </p>
      </div>
    );
  }

  const ef = change.eficacia ?? {};
  const semAcao = simWithoutAction(change);

  function handleDelete() {
    if (window.confirm(`Excluir a mudança ${change.id}? Essa ação não pode ser desfeita.`)) {
      deleteChange(change.id);
      navigate("/mudancas");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">{change.id}</span>
          <h1>{change.titulo}</h1>
          <p>{change.descricao}</p>
        </div>
        <div className="page-actions no-print">
          <StatusBadge status={deriveStatus(change)} />
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir
          </button>
          {pode(user, "editarMudanca") && (
            <Link to={`/mudancas/${change.id}/editar`} className="btn btn-ghost">
              <Pencil size={16} /> Editar
            </Link>
          )}
          {pode(user, "excluirMudanca") && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} /> Excluir
            </button>
          )}
        </div>
      </header>

      <div className="stepper">
        {etapas(change).map((s) => (
          <div key={s.titulo} className={`step ${s.estado}`}>
            <strong>{s.titulo}</strong>
            {s.texto}
          </div>
        ))}
      </div>

      {semAcao.length > 0 && (
        <div className="notice warn">
          Há {semAcao.length} item(ns) respondido(s) "Sim" sem ação vinculada:{" "}
          {semAcao.map((s) => itemLabel(s.checklist, s.item)).join(", ")}.{" "}
          <Link to={`/mudancas/${change.id}/editar`}>Adicionar ações</Link>
        </div>
      )}
      {eficaciaAtrasada(change) && (
        <div className="notice warn">
          A verificação de eficácia estava prevista para {formatDate(ef.dataPrevista)} e ainda não foi registrada.
        </div>
      )}

      <section className="card">
        <h2>Dados gerais</h2>
        <dl className="meta-grid" style={{ marginTop: 16 }}>
          <div>
            <dt>Elaborador</dt>
            <dd>{change.elaborador}</dd>
          </div>
          <div>
            <dt>Aprovador</dt>
            <dd>{change.aprovador}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{formatDate(change.data)}</dd>
          </div>
          <div>
            <dt>Risco significativo</dt>
            <dd>{change.riscoSignificativo ? `Sim — ${change.especialista || "especialista não informado"}` : "Não"}</dd>
          </div>
          <div>
            <dt>Aprovação</dt>
            <dd>
              {change.aprovacao?.aprovada
                ? `Aprovada por ${change.aprovador} em ${formatDate(change.aprovacao.data)}`
                : "Pendente"}
            </dd>
          </div>
        </dl>
                {pode(user, "avaliarPlano") && (
          <div className="no-print" style={{ marginTop: 16 }}>
            {change.aprovacao?.aprovada ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => revokeApproval(change.id)}>
                Remover aprovação
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => approveChange(change.id, todayISO())}>
                Aprovar mudança
              </button>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Checklists</h2>
        <p className="card-sub">Respostas registradas na avaliação.</p>
        {CHECKLIST_KEYS.filter((k) => change.checklists?.[k]).map((k) => (
          <details className="answers" key={k}>
            <summary>
              {CHECKLISTS[k].short} — {Object.values(change.respostas?.[k] ?? {}).filter((v) => v === "sim").length} "Sim"
            </summary>
            <div className="checklist">
              {CHECKLISTS[k].items.map((item) => {
                const sim = change.respostas?.[k]?.[item.n] === "sim";
                return (
                  <Fragment key={item.n}>
                    <div className="check-row">
                      <span className="check-n">{item.n}</span>
                      <span className="check-text">{item.text}</span>
                      <span className={`answer ${sim ? "yes" : "no"}`}>{sim ? "Sim" : "Não"}</span>
                    </div>
                    {item.outros && sim && change.outros?.[k] && (
                      <p className="hint" style={{ padding: "0 0 12px 46px" }}>
                        Descrição: {change.outros[k]}
                      </p>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </details>
        ))}
      </section>

      <section className="card">
        <h2>Ações</h2>
        <p className="card-sub">Acompanhamento das ações necessárias à mudança.</p>
        {change.acoes.length === 0 ? (
          <div className="empty">Nenhuma ação cadastrada.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Ação</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Término em</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {change.acoes.map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap" title={itemText(a.checklist, a.item)}>
                      {itemLabel(a.checklist, a.item)}
                    </td>
                    <td>{a.acao}</td>
                    <td>{a.responsavel}</td>
                    <td className="nowrap">{formatDate(a.prazo)}</td>
                    <td>
                      <CompleteAction changeId={change.id} action={a} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={acaoStatus(a)} />
                        {venceEmBreve(a) && <StatusBadge status="Vence em breve" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Análise crítica / eficácia</h2>
        <p className="card-sub">
          Responsável: {ef.responsavel || "—"} · Data prevista: {formatDate(ef.dataPrevista)}
        </p>

                {ef.dataReal ? (
          <>
            <dl className="meta-grid">
              <div>
                <dt>Data real da verificação</dt>
                <dd>{formatDate(ef.dataReal)}</dd>
              </div>
              <div>
                <dt>Resultado</dt>
                <dd>{ef.eficaz ? "Eficaz" : "Não eficaz — revisão necessária"}</dd>
              </div>
              <div>
                <dt>Observação</dt>
                <dd>{ef.observacao || "—"}</dd>
              </div>
            </dl>
            {pode(user, "verificarEficacia") && (
              <div className="no-print" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => reopenEficacia(change.id)}>
                  <RotateCcw size={14} /> Reabrir verificação
                </button>
              </div>
            )}
          </>
        ) : canVerifyEficacia(change) ? (
          pode(user, "verificarEficacia") ? (
            <EficaciaForm changeId={change.id} />
          ) : (
            <div className="notice info">
              Aguardando o gestor da área (SGI) registrar a verificação de eficácia.
            </div>
          )
        ) : (
          <div className="notice info">Conclua todas as ações para registrar a verificação de eficácia.</div>
        )}
      </section>

      <section className="card">
        <h2>Histórico</h2>
        <ul className="timeline" style={{ marginTop: 16 }}>
          {[...change.historico].reverse().map((h) => (
            <li key={h.id}>
              <span className={`dot ${h.tipo}`} />
              <div>
                <p>{h.texto}</p>
                <small>{formatDateTime(h.em)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default MudancaDetalhe;
