import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Clock, ListChecks, AlertTriangle, Plus, ArrowUpRight } from "lucide-react";

import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import StatusChart from "../components/StatusChart";
import ActionsChart from "../components/ActionsChart";
import { useChanges } from "../hooks/useChanges";
import { STATUS, acaoStatus, deriveStatus, eficaciaAtrasada, venceEmBreve } from "../utils/changes";
import { formatDate } from "../utils/dates";
import "../styles/ui.css";
import "./Dashboard.css";

const pad2 = (n) => String(n).padStart(2, "0");

function Dashboard() {
  const { changes } = useChanges();
  const navigate = useNavigate();

  const resumo = useMemo(() => {
    const todasAcoes = changes.flatMap((c) => c.acoes);
    return {
      total: changes.length,
      emAndamento: changes.filter((c) => deriveStatus(c) === STATUS.EM_ANDAMENTO).length,
      pendentes: todasAcoes.filter((a) => acaoStatus(a) === "Pendente").length,
      atrasadas: todasAcoes.filter((a) => acaoStatus(a) === "Atrasada").length,
      eficaciasAtrasadas: changes.filter((c) => eficaciaAtrasada(c)).length,
      vencendo: todasAcoes.filter((a) => venceEmBreve(a)).length,
    };
  }, [changes]);

  const recentes = useMemo(
    () => [...changes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5),
    [changes],
  );

  const precisaAtencao = resumo.atrasadas > 0 || resumo.eficaciasAtrasadas > 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="welcome-label">SISTEMA SGI / GESTÃO</span>
          <h1>Visão geral</h1>
          <p>Acompanhe as mudanças e suas respectivas ações.</p>
        </div>

        <button className="new-change-button" onClick={() => navigate("/nova-mudanca")}>
          <Plus size={18} />
          Nova mudança
        </button>
      </header>

      <section className="stats-grid">
        <StatCard
          title="Total de mudanças"
          value={pad2(resumo.total)}
          description="Registros cadastrados"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Em andamento"
          value={pad2(resumo.emAndamento)}
          description="Mudanças em execução"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Ações pendentes"
          value={pad2(resumo.pendentes)}
          description="Aguardando conclusão"
          icon={ListChecks}
          color="green"
        />
        <StatCard
          title="Ações atrasadas"
          value={pad2(resumo.atrasadas)}
          description="Precisam de atenção"
          icon={AlertTriangle}
          color="red"
        />
      </section>

      <section className="charts-grid">
        <StatusChart changes={changes} />
        <ActionsChart changes={changes} />
      </section>

      <section className="dashboard-content">
        <div className="recent-changes">
          <div className="section-header">
            <div>
              <h2>Últimas mudanças</h2>
              <p>Acompanhe os registros recentes.</p>
            </div>

            <button className="view-all-button" onClick={() => navigate("/mudancas")}>
              Ver todas <ArrowUpRight size={16} />
            </button>
          </div>

          {recentes.length === 0 ? (
            <div className="empty">
              <h3>Nenhuma mudança cadastrada</h3>
              <p>
                <Link to="/nova-mudanca">Cadastre a primeira mudança</Link>
              </p>
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
                        <StatusBadge status={deriveStatus(change)} />
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
            <AlertTriangle size={22} />
          </div>

          <h3>Atenção às ações</h3>

          <p>
            {precisaAtencao
              ? `${resumo.atrasadas} ação(ões) atrasada(s) e ${resumo.eficaciasAtrasadas} verificação(ões) de eficácia vencida(s). Acompanhe para evitar atrasos no processo.`
              : "Nenhuma ação atrasada no momento. Continue acompanhando os prazos."}
          </p>

          {resumo.vencendo > 0 && (
            <p>{resumo.vencendo} ação(ões) vence(m) nos próximos 7 dias.</p>
          )}

          <button onClick={() => navigate("/acoes")}>
            Acompanhar ações
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
