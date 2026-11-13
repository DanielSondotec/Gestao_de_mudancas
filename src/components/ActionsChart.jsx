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
import { acaoResumoStatus, ACTION_STATUS } from "../utils/changes";
import "../styles/ui.css";

const SITUACOES = [
  { nome: ACTION_STATUS.ABERTA, cor: "#2563eb" },
  { nome: ACTION_STATUS.AGUARDANDO_AVALIACAO, cor: "#d97706" },
  { nome: ACTION_STATUS.PLANO_APROVADO, cor: "#0d9488" },
  { nome: ACTION_STATUS.CORRECAO, cor: "#dc2626" },
  { nome: ACTION_STATUS.EXECUTADA, cor: "#16a34a" },
  { nome: ACTION_STATUS.ATRASADA, cor: "#991b1b" },
];

function ActionsChart({ changes }) {
  const acoes = changes.flatMap((c) => c.acoes ?? []);

  const data = SITUACOES
    .map((s) => ({
      name: s.nome,
      value: acoes.filter((a) => acaoResumoStatus(a) === s.nome).length,
      cor: s.cor,
    }))
    .filter((situacao) => situacao.value > 0);

  return (
    <div className="card dashboard-chart">
      <h2>Ações por situação</h2>
      <p className="card-sub">Ações abertas, em avaliação, aprovadas, concluídas ou atrasadas.</p>

      {acoes.length === 0 ? (
        <div className="empty">Sem ações para exibir.</div>
      ) : (
        <div className="dashboard-chart-body">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
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