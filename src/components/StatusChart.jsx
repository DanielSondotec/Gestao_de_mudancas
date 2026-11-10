import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { STATUS, deriveStatus } from "../utils/changes";
import "../styles/ui.css";

// Mesmas cores dos selos de status.
const CORES = {
  [STATUS.PLANEJAMENTO]: "#f59e0b",
  [STATUS.EM_ANDAMENTO]: "#f97316",
  [STATUS.AGUARDANDO_EFICACIA]: "#7c3aed",
  [STATUS.CONCLUIDA]: "#16a34a",
  [STATUS.REVISAO]: "#dc2626",
};

function StatusChart({ changes }) {
  const data = Object.values(STATUS)
    .map((status) => ({
      name: status,
      value: changes.filter((c) => deriveStatus(c) === status).length,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="card">
      <h2>Mudanças por status</h2>
      <p className="card-sub">Distribuição atual dos registros.</p>

      {data.length === 0 ? (
        <div className="empty">Sem dados para exibir.</div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default StatusChart;