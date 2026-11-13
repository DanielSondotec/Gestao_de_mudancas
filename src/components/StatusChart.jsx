import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RESUMO_STATUS, deriveSummaryStatus } from "../utils/changes";
import "../styles/ui.css";

// Mesmas cores dos selos de status.
const CORES = {
  [RESUMO_STATUS.ABERTURA]: "#64748b",
  [RESUMO_STATUS.ANALISE]: "#2563eb",
  [RESUMO_STATUS.PROPOSTA]: "#7c3aed",
  [RESUMO_STATUS.EXECUCAO]: "#d97706",
  [RESUMO_STATUS.EFICACIA]: "#0d9488",
  [RESUMO_STATUS.REVISAO]: "#ea580c",
  [RESUMO_STATUS.CONCLUIDA]: "#16a34a",
  [RESUMO_STATUS.CANCELADA]: "#6b7280",
  [RESUMO_STATUS.ATRASADA]: "#dc2626",
};

function StatusChart({ changes }) {
  const data = Object.values(RESUMO_STATUS)
    .map((status) => ({
      name: status,
      value: changes.filter((c) => deriveSummaryStatus(c) === status).length,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="card dashboard-chart">
      <h2>Mudanças por status</h2>
      <p className="card-sub">Distribuição atual dos registros.</p>

      {data.length === 0 ? (
        <div className="empty">Sem dados para exibir.</div>
      ) : (
        <div className="dashboard-chart-body">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={CORES[d.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={42} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default StatusChart;