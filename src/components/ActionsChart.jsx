import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { acaoStatus } from "../utils/changes";
import "../styles/ui.css";

const SITUACOES = [
  { nome: "Concluída", cor: "#16a34a" },
  { nome: "Pendente", cor: "#2563eb" },
  { nome: "Atrasada", cor: "#dc2626" },
];

function ActionsChart({ changes }) {
  const acoes = changes.flatMap((c) => c.acoes);

  const data = SITUACOES.map((s) => ({
    name: s.nome,
    value: acoes.filter((a) => acaoStatus(a) === s.nome).length,
    cor: s.cor,
  }));

  return (
    <div className="card">
      <h2>Ações por situação</h2>
      <p className="card-sub">Concluídas, pendentes e atrasadas em todas as mudanças.</p>

      {acoes.length === 0 ? (
        <div className="empty">Sem ações para exibir.</div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="value" name="Ações" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ActionsChart;