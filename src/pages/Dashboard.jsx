import { useMemo } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  ListChecks,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Filter,
  RotateCcw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import StatusChart from "../components/StatusChart";
import ActionsChart from "../components/ActionsChart";
import { useChanges } from "../hooks/useChanges";
import { deriveSummaryStatus, RESUMO_STATUS } from "../utils/changes";
import { addDays, formatDate, todayISO } from "../utils/dates";
import "../styles/ui.css";
import "./Dashboard.css";

const pad2 = (n) => String(n).padStart(2, "0");
const statusAbertas = [
  RESUMO_STATUS.ABERTURA,
  RESUMO_STATUS.ANALISE,
  RESUMO_STATUS.PROPOSTA,
  RESUMO_STATUS.EXECUCAO,
  RESUMO_STATUS.EFICACIA,
  RESUMO_STATUS.REVISAO,
];

function Dashboard() {
  const { changes } = useChanges();
  const navigate = useNavigate();
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [periodo, setPeriodo] = useState("todos");
  const activeChanges = useMemo(() => changes.filter((change) => !change.arquivadaEm), [changes]);
  const areas = useMemo(
    () => [...new Set(activeChanges.map((change) => change.area?.trim() || "Não informada"))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [activeChanges],
  );
  const filteredChanges = useMemo(() => {
    const hoje = todayISO();
    const dataInicial = periodo === "30"
      ? addDays(hoje, -29)
      : periodo === "90"
        ? addDays(hoje, -89)
        : periodo === "ano"
          ? `${hoje.slice(0, 4)}-01-01`
          : "";

    return activeChanges.filter((change) => {
      if (filtroStatus && deriveSummaryStatus(change) !== filtroStatus) return false;
      if (filtroArea && (change.area?.trim() || "Não informada") !== filtroArea) return false;
      if (dataInicial) {
        const data = change.data || "";
        if (!data || data < dataInicial || data > hoje) return false;
      }
      return true;
    });
  }, [activeChanges, filtroArea, filtroStatus, periodo]);
  const filtrosAtivos = Boolean(filtroStatus || filtroArea || periodo !== "todos");

  const resumo = useMemo(() => {
    return {
      total: filteredChanges.length,
      abertas: filteredChanges.filter((c) => statusAbertas.includes(deriveSummaryStatus(c))).length,
      concluidas: filteredChanges.filter((c) => deriveSummaryStatus(c) === RESUMO_STATUS.CONCLUIDA).length,
      atrasadas: filteredChanges.filter((c) => deriveSummaryStatus(c) === RESUMO_STATUS.ATRASADA).length,
    };
  }, [filteredChanges]);

  const recentes = useMemo(
    () => [...filteredChanges].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 5),
    [filteredChanges],
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="welcome-label">SISTEMA SGI / GESTÃO</span>
          <h1>Visão geral</h1>
          <p>Acompanhe as mudanças e identifique o que precisa de atenção.</p>
        </div>

        <button className="new-change-button" onClick={() => navigate("/nova-mudanca")}>
          <Plus size={18} />
          Nova mudança
        </button>
      </header>

      <section className="dashboard-filters" aria-label="Filtros do dashboard">
        <div className="dashboard-filters-title">
          <Filter size={17} aria-hidden="true" />
          <div>
            <h2>Filtros</h2>
            <p>Refine os indicadores e a lista abaixo.</p>
          </div>
        </div>

        <div className="dashboard-filter-fields">
          <label className="dashboard-filter" htmlFor="filtro-status">
            <span>Status</span>
            <select
              id="filtro-status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
            >
              <option value="">Todos os status</option>
              {Object.values(RESUMO_STATUS).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="dashboard-filter" htmlFor="filtro-area">
            <span>Área/contrato</span>
            <select
              id="filtro-area"
              value={filtroArea}
              onChange={(event) => setFiltroArea(event.target.value)}
            >
              <option value="">Todas as áreas</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>

          <label className="dashboard-filter" htmlFor="filtro-periodo">
            <span>Período de cadastro</span>
            <select
              id="filtro-periodo"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
            >
              <option value="todos">Todo o período</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="ano">Este ano</option>
            </select>
          </label>
        </div>

        {filtrosAtivos && (
          <button
            type="button"
            className="clear-filters-button"
            onClick={() => {
              setFiltroStatus("");
              setFiltroArea("");
              setPeriodo("todos");
            }}
          >
            <RotateCcw size={14} /> Limpar
          </button>
        )}
      </section>

      <p className="dashboard-result-count" aria-live="polite">
        Exibindo <strong>{filteredChanges.length}</strong> de <strong>{activeChanges.length}</strong> mudanças ativas
      </p>

      <section className="stats-grid">
        <StatCard
          title="Mudanças ativas"
          value={pad2(resumo.total)}
          description="No recorte selecionado"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Em andamento"
          value={pad2(resumo.abertas)}
          description="Etapas não concluídas"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Concluídas"
          value={pad2(resumo.concluidas)}
          description="Eficácia confirmada"
          icon={ListChecks}
          color="green"
        />
        <StatCard
          title="Atrasadas"
          value={pad2(resumo.atrasadas)}
          description="Ações fora do prazo"
          icon={AlertTriangle}
          color="red"
        />
      </section>

      {resumo.atrasadas > 0 && (
        <div className="dashboard-alert" role="status">
          <span className="dashboard-alert-icon"><AlertTriangle size={17} /></span>
          <p>
            <strong>{resumo.atrasadas} mudança(s) atrasada(s)</strong> no recorte atual. Verifique as ações pendentes.
          </p>
          <button type="button" onClick={() => navigate("/acoes")}>
            Ver ações <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      <section className="charts-grid">
        <StatusChart changes={filteredChanges} />
        <ActionsChart changes={filteredChanges} />
      </section>

      <section className="dashboard-content">
        <div className="recent-changes">
          <div className="section-header">
            <div>
              <h2>Últimas mudanças</h2>
              <p>
                {filtrosAtivos
                  ? `Mais recentes dentro dos filtros selecionados (${recentes.length} de ${filteredChanges.length}).`
                  : "Acompanhe os registros recentes."}
              </p>
            </div>

            <button className="view-all-button" onClick={() => navigate("/mudancas")}>
              Ver todas <ArrowUpRight size={16} />
            </button>
          </div>

          {recentes.length === 0 ? (
            <div className="empty">
              <h3>{filtrosAtivos ? "Nenhuma mudança encontrada" : "Nenhuma mudança cadastrada"}</h3>
              {filtrosAtivos ? (
                <button
                  type="button"
                  className="clear-filters-button"
                  onClick={() => {
                    setFiltroStatus("");
                    setFiltroArea("");
                    setPeriodo("todos");
                  }}
                >
                  Limpar filtros
                </button>
              ) : (
                <p><Link to="/nova-mudanca">Cadastre a primeira mudança</Link></p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Identificação</th>
                    <th>Mudança</th>
                    <th>Elaborador</th>
                    <th>Data</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentes.map((change) => (
                    <tr key={change.id}>
                      <td className="change-id">
                        <Link to={`/mudancas/${change.id}`}>{change.id}</Link>
                      </td>
                      <td>{change.titulo}</td>
                      <td>{change.elaborador}</td>
                      <td>{formatDate(change.data)}</td>
                      <td>
                        <StatusBadge status={deriveSummaryStatus(change)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dashboard-side-card">
          <div className="side-card-icon">
            <ListChecks size={21} />
          </div>

          <h3>Acompanhe as ações</h3>

          <p>
            Consulte responsáveis, prazos e andamento das ações em um só lugar.
          </p>

          <button onClick={() => navigate("/acoes")}>
            Abrir ações
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
