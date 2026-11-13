import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil, Printer, RotateCcw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { pode } from "../utils/permissoes";
import AnaliseSGI from "../components/AnaliseSGI";
import { ETAPA } from "../data/formulario";
import MudancaForm from "./MudancaForm";

import StatusBadge from "../components/StatusBadge";
import CompleteAction from "../components/CompleteAction";
import { useChanges } from "../hooks/useChanges";
import { CHECKLISTS, CHECKLIST_KEYS, itemLabel, itemText } from "../data/checklists";
import {
  acaoResumoStatus,
  canVerifyEficacia,
  deriveSummaryStatus,
  maxEficaciaDate,
  simWithoutAction,
  validateActionPlanning,
} from "../utils/changes";
import { formatDate, formatDateTime, todayISO } from "../utils/dates";
import "../styles/ui.css";

function PlanReview({ changeId, action, user, readOnly }) {
  const { approvePlan, rejectPlan } = useChanges();
  const [rejeitando, setRejeitando] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  if (readOnly || !pode(user, "avaliarPlano") || action.statusPlano !== "aguardando_aprovacao") {
    return null;
  }

  function handleReject(event) {
    event.preventDefault();
    const texto = justificativa.trim();
    if (!texto) return;
    rejectPlan(changeId, action.id, texto, user.nome || user.usuario, todayISO());
  }

  return (
    <div className="no-print">
      <div className="page-actions" style={{ margin: 0 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => approvePlan(changeId, action.id, "", user.nome || user.usuario, todayISO())}
        >
          Aprovar solução
        </button>
        {!rejeitando && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setRejeitando(true)}>
            Rejeitar
          </button>
        )}
      </div>
      {rejeitando && (
        <form className="form-grid" onSubmit={handleReject} style={{ marginTop: 10 }}>
          <div className="field span-2">
            <label htmlFor={`rejeicao-${action.id}`}>Justificativa da rejeição</label>
            <textarea
              id={`rejeicao-${action.id}`}
              className="input"
              rows={2}
              value={justificativa}
              onChange={(event) => setJustificativa(event.target.value)}
              required
            />
          </div>
          <div className="span-2 page-actions" style={{ margin: 0 }}>
            <button type="submit" className="btn btn-danger btn-sm" disabled={!justificativa.trim()}>
              Confirmar rejeição
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejeitando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function EficaciaForm({ change }) {
  const { verifyEficacia } = useChanges();
  const prazoMaximo = maxEficaciaDate(change);
  const [verificador, setVerificador] = useState(change.eficacia?.responsavel ?? "");
  const [dataPrevista, setDataPrevista] = useState(
    change.eficacia?.dataPrevista || prazoMaximo || "",
  );
  const [dataReal, setDataReal] = useState(todayISO());
  const [eficaz, setEficaz] = useState(change.eficacia?.eficaz ?? true);
  const [analiseCritica, setAnaliseCritica] = useState(change.eficacia?.observacao ?? "");
  const [errors, setErrors] = useState([]);

  function handleSubmit(e) {
    e.preventDefault();
    const errs = [];

    if (!verificador.trim()) errs.push("Informe o verificador.");
    if (!dataPrevista) errs.push("Informe a data prevista.");
    if (!dataReal) errs.push("Informe a data real da verificação.");
    if (!analiseCritica.trim()) errs.push("Preencha a análise crítica.");

    const normalizar = (nome) => (nome ?? "").trim().toLocaleLowerCase("pt-BR");
    const envolvidos = [
      change.solicitante,
      change.elaborador,
      ...change.acoes.flatMap((acao) => [acao.responsavel, acao.responsavelId]),
    ].filter(Boolean);

    if (
      verificador.trim() &&
      envolvidos.some((nome) => normalizar(nome) === normalizar(verificador))
    ) {
      errs.push("O verificador deve ser diferente do solicitante e dos responsáveis pelas ações.");
    }
    if (prazoMaximo && dataPrevista && dataPrevista > prazoMaximo) {
      errs.push(`A data prevista deve ser até ${formatDate(prazoMaximo)}.`);
    }
    if (prazoMaximo && dataReal && dataReal > prazoMaximo) {
      errs.push(`A data real da verificação deve ser até ${formatDate(prazoMaximo)}.`);
    }

    setErrors(errs);
    if (errs.length) return;

    verifyEficacia(change.id, {
      responsavel: verificador.trim(),
      dataPrevista,
      dataReal,
      eficaz,
      observacao: analiseCritica.trim(),
    });
  }

  return (
    <form className="eficacia-form" onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div className="form-errors span-3" role="alert">
          <strong>Corrija os pontos abaixo:</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="field">
        <label htmlFor="ef-verificador">Verificador *</label>
        <input
          id="ef-verificador"
          className="input"
          value={verificador}
          onChange={(e) => setVerificador(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="ef-prevista">Data prevista</label>
        <input
          id="ef-prevista"
          type="date"
          className="input"
          value={dataPrevista}
          max={prazoMaximo || undefined}
          onChange={(e) => setDataPrevista(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="ef-real">Data real da verificação *</label>
        <input
          id="ef-real"
          type="date"
          className="input"
          value={dataReal}
          max={prazoMaximo || undefined}
          onChange={(e) => setDataReal(e.target.value)}
          required
        />
      </div>

      <fieldset className="field span-3 eficacia-result">
        <legend className="label">A mudança atendeu aos resultados esperados?</legend>
        <div className="eficacia-options">
          <label>
            <input type="radio" name="eficaz" checked={eficaz} onChange={() => setEficaz(true)} />
            Eficaz
          </label>
          <label>
            <input type="radio" name="eficaz" checked={!eficaz} onChange={() => setEficaz(false)} />
            Não eficaz
          </label>
        </div>
      </fieldset>

      <div className="field span-3">
        <label htmlFor="ef-obs">Análise crítica *</label>
        <textarea
          id="ef-obs"
          className="input"
          rows={4}
          value={analiseCritica}
          onChange={(e) => setAnaliseCritica(e.target.value)}
          required
        />
      </div>
      <div className="span-3">
        <button type="submit" className="btn btn-primary">
          Registrar verificação
        </button>
      </div>
    </form>
  );
}

function MudancaDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const { changes, reopenEficacia } = useChanges();
  const change = changes.find((c) => c.id === id);
  const [planejamentoOverride, setPlanejamentoOverride] = useState(null);

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
  const planejamentoIncompleto = validateActionPlanning(change).length > 0;
  const planejamentoKey = `${change.id}:${change.ciclo ?? 1}`;
  const planejamentoAberto =
    planejamentoOverride?.key === planejamentoKey
      ? planejamentoOverride.aberto
      : planejamentoIncompleto;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">{change.id}</span>
          <h1>{change.titulo}</h1>
          <p>{change.descricao}</p>
        </div>
        <div className="page-actions no-print">
          <StatusBadge status={deriveSummaryStatus(change)} />
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir
          </button>
          {!change.arquivadaEm &&
            !change.etapa &&
            pode(user, "editarMudanca") && (
            <Link to={`/mudancas/${change.id}/editar`} className="btn btn-ghost">
              <Pencil size={16} /> Editar
            </Link>
          )}
        </div>
      </header>

      {change.arquivadaEm && (
        <div className="notice info">
          Registro arquivado em {formatDate(change.arquivadaEm)}. Este registro está em modo de consulta.
        </div>
      )}

      {!change.arquivadaEm && semAcao.length > 0 && (
        <div className="notice warn">
          Há {semAcao.length} item(ns) respondido(s) "Sim" sem ação vinculada:{" "}
          {semAcao.map((s) => itemLabel(s.checklist, s.item, change)).join(", ")}.{" "}
          <Link to={`/mudancas/${change.id}/editar`}>Adicionar ações</Link>
        </div>
      )}

      {!change.arquivadaEm && change.etapa === ETAPA.ANALISE && <AnaliseSGI change={change} />}
      {!change.arquivadaEm &&
        change.etapa === ETAPA.PROPOSTA &&
        pode(user, "editarMudanca") && (
          planejamentoAberto ? (
            <MudancaForm
              key={change.id}
              change={change}
              onSaved={() => setPlanejamentoOverride({ key: planejamentoKey, aberto: false })}
              onCancel={() => setPlanejamentoOverride({ key: planejamentoKey, aberto: false })}
            />
          ) : (
            <section className="card">
              <h2>Plano de ação · Ciclo {change.ciclo ?? 1}</h2>
              <p className="card-sub">
                {planejamentoIncompleto
                  ? "O planejamento ainda precisa ser preenchido."
                  : "Planos de ação salvos para as perguntas marcadas como Sim pelo cliente."}
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPlanejamentoOverride({ key: planejamentoKey, aberto: true })}
              >
                {planejamentoIncompleto ? "Continuar planejamento" : "Editar planos"}
              </button>
            </section>
          )
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
        </dl>
      </section>

      {!pode(user, "verTodasMudancas") && (
        <section className="card">
          <h2>Checklists respondidos</h2>
          <p className="card-sub">Respostas preenchidas pelo solicitante.</p>
          {CHECKLIST_KEYS.filter((k) => change.checklists?.[k]).map((k) => (
            <details className="answers" key={k}>
              <summary>
                {CHECKLISTS[k].short} — {Object.values(change.respostas?.[k] ?? {}).filter((v) => v === "sim").length} “Sim”
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
      )}

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
                  <th>Solução proposta</th>
                  <th>Avaliação</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {change.acoes.map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap" title={itemText(a.checklist, a.item, change)}>
                      {itemLabel(a.checklist, a.item, change)}
                    </td>
                    <td>
                      <strong>{a.acao || "—"}</strong>
                      {(a.porque || a.onde || a.como || a.quanto) && (
                        <details className="action-plan-details">
                          <summary>Ver detalhes 5W2H</summary>
                          <dl>
                            <dt>Por quê?</dt><dd>{a.porque || "—"}</dd>
                            <dt>Onde?</dt><dd>{a.onde || "—"}</dd>
                            <dt>Como?</dt><dd>{a.como || "—"}</dd>
                            <dt>Quanto?</dt><dd>{a.quanto || "—"}</dd>
                          </dl>
                        </details>
                      )}
                    </td>
                    <td>{a.responsavel}</td>
                    <td className="nowrap">{formatDate(a.prazo)}</td>
                    <td>
                      {a.resolucao && <p>{a.resolucao}</p>}
                      <CompleteAction changeId={change.id} action={a} readOnly={Boolean(change.arquivadaEm)} />
                    </td>
                    <td>
                      {a.avaliacao ? (
                        <div>
                          <strong>{a.avaliacao.status === "aprovado" ? "Aprovada" : "Rejeitada"}</strong>
                          <p>{a.avaliacao.observacao || "Sem observação."}</p>
                          <small>
                            {a.avaliacao.avaliador || "Gestor"} · {formatDate(a.avaliacao.data)}
                          </small>
                        </div>
                      ) : (
                        <PlanReview
                          changeId={change.id}
                          action={a}
                          user={user}
                          readOnly={Boolean(change.arquivadaEm)}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={acaoResumoStatus(a)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(change.ciclos ?? []).length > 0 && (
        <section className="card">
          <h2>Ciclos anteriores</h2>
          <p className="card-sub">Planos e verificações preservados quando a eficácia não foi confirmada.</p>
          {(change.ciclos ?? []).map((ciclo) => (
            <details className="answers" key={ciclo.numero}>
              <summary>
                Ciclo {ciclo.numero} · Não eficaz em {formatDate(ciclo.eficacia?.dataReal)}
              </summary>
              <p>
                Verificador: {ciclo.eficacia?.responsavel || "—"} · Análise crítica: {ciclo.eficacia?.observacao || "—"}
              </p>
              <ul className="readonly-answers">
                {(ciclo.acoes ?? []).map((acao) => (
                  <li key={acao.id}>
                    <strong>{itemLabel(acao.checklist, acao.item, change)} · {acao.acao || "Plano sem descrição"}</strong>
                    <span>Por quê: {acao.porque || "—"} · Onde: {acao.onde || "—"}</span>
                    <span>Quando: {formatDate(acao.prazo)} · Quem: {acao.responsavel || "—"}</span>
                    <span>Como: {acao.como || "—"} · Quanto: {acao.quanto || "—"}</span>
                    {acao.resolucao && <span>Evidência/solução: {acao.resolucao}</span>}
                    {(acao.resolucaoAnexos ?? []).length > 0 && (
                      <small>Arquivos: {acao.resolucaoAnexos.map((anexo) => anexo.name).join(", ")}</small>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Verificação de eficácia</h2>
        <p className="card-sub">
          Prazo máximo: 6 meses após a última ação (até {maxEficaciaDate(change) || "—"}). A verificação deve ser feita por pessoa diferente do solicitante e dos responsáveis pelas ações.
        </p>

        <div className="eficacia-actions">
          {change.acoes.map((acao) => (
            <div className="eficacia-action" key={acao.id}>
              <strong>{acao.acao}</strong>
              <p>
                {acao.responsavel || "Responsável não informado"} · concluída em {acao.termino || "—"} · evidência: {acao.resolucao || "—"}
              </p>
            </div>
          ))}
        </div>

        {ef.dataReal ? (
          <>
            <dl className="meta-grid">
              <div>
                <dt>Verificador</dt>
                <dd>{ef.responsavel || "—"}</dd>
              </div>
              <div>
                <dt>Data prevista</dt>
                <dd>{formatDate(ef.dataPrevista)}</dd>
              </div>
              <div>
                <dt>Data real da verificação</dt>
                <dd>{formatDate(ef.dataReal)}</dd>
              </div>
              <div>
                <dt>Resultado</dt>
                <dd>{ef.eficaz ? "Eficaz" : "Não eficaz — revisão necessária"}</dd>
              </div>
              <div>
                <dt>Análise crítica</dt>
                <dd>{ef.observacao || "—"}</dd>
              </div>
            </dl>
            {!change.arquivadaEm && pode(user, "verificarEficacia") && (
              <div className="no-print" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => reopenEficacia(change.id)}>
                  <RotateCcw size={14} /> Reabrir verificação
                </button>
              </div>
            )}
          </>
        ) : change.arquivadaEm ? (
          <div className="notice info">Registro arquivado sem verificação de eficácia pendente.</div>
        ) : canVerifyEficacia(change) ? (
          pode(user, "verificarEficacia") ? (
            <EficaciaForm change={change} />
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
