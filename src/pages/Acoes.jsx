import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import CompleteAction from "../components/CompleteAction";
import { useChanges } from "../hooks/useChanges";
import { itemLabel } from "../data/checklists";
import { acaoStatus, venceEmBreve } from "../utils/changes";
import { formatDate } from "../utils/dates";
import "../styles/ui.css";

const FILTROS = ["Todas", "Pendente", "Atrasada", "Concluída"];

function Acoes() {
  const { changes } = useChanges();
  const [filtro, setFiltro] = useState("Pendente");
  const [busca, setBusca] = useState("");

  const todas = useMemo(
    () =>
      changes.flatMap((c) =>
        c.acoes.map((a) => ({ change: c, acao: a, situacao: acaoStatus(a) })),
      ),
    [changes],
  );

  const contagem = (f) => (f === "Todas" ? todas.length : todas.filter((t) => t.situacao === f).length);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todas
      .filter((t) => filtro === "Todas" || t.situacao === filtro)
      .filter(
        (t) =>
          !q ||
          [t.acao.acao, t.acao.responsavel, t.change.id, t.change.titulo].join(" ").toLowerCase().includes(q),
      )
      .sort((a, b) => (a.acao.prazo || "9999").localeCompare(b.acao.prazo || "9999"));
  }, [todas, filtro, busca]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>Acompanhamento de ações</h1>
          <p>Todas as ações das mudanças, ordenadas por prazo.</p>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input
              className="input"
              placeholder="Buscar por ação, responsável ou mudança…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="segmented" role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                className={filtro === f ? "active" : ""}
                onClick={() => setFiltro(f)}
              >
                {f} ({contagem(f)})
              </button>
            ))}
          </div>
        </div>

        {lista.length === 0 ? (
          <div className="empty">
            <h3>Nenhuma ação encontrada</h3>
            <p>Não há ações para este filtro.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mudança</th>
                  <th>Item</th>
                  <th>Ação</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Término em</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(({ change, acao, situacao }) => (
                  <tr key={`${change.id}-${acao.id}`}>
                    <td className="nowrap">
                      <Link to={`/mudancas/${change.id}`}>{change.id}</Link>
                    </td>
                    <td className="nowrap">{itemLabel(acao.checklist, acao.item)}</td>
                    <td>{acao.acao}</td>
                    <td>{acao.responsavel}</td>
                    <td className="nowrap">{formatDate(acao.prazo)}</td>
                    <td>
                      <CompleteAction changeId={change.id} action={acao} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={situacao} />
                        {venceEmBreve(acao) && <StatusBadge status="Vence em breve" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Acoes;
