import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import { useChanges } from "../hooks/useChanges";
import { STATUS, deriveStatus } from "../utils/changes";
import { formatDate } from "../utils/dates";
import "../styles/ui.css";

const FILTROS = ["Todas", ...Object.values(STATUS)];

function Mudancas() {
  const { changes } = useChanges();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todas");

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return changes
      .map((c) => ({ change: c, status: deriveStatus(c) }))
      .filter(({ change: c, status }) => {
        if (filtro !== "Todas" && status !== filtro) return false;
        if (!q) return true;
        return [c.id, c.titulo, c.descricao, c.elaborador, c.aprovador]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.change.data.localeCompare(a.change.data));
  }, [changes, busca, filtro]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>Mudanças cadastradas</h1>
          <p>{changes.length} registro(s) no sistema.</p>
        </div>
        <div className="page-actions">
          <Link to="/nova-mudanca" className="btn btn-primary">
            <Plus size={16} /> Nova mudança
          </Link>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input
              className="input"
              placeholder="Buscar por identificação, título, elaborador…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: "auto" }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {FILTROS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>

        {lista.length === 0 ? (
          <div className="empty">
            <h3>Nenhuma mudança encontrada</h3>
            <p>Ajuste a busca ou o filtro, ou cadastre uma nova mudança.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identificação</th>
                  <th>Mudança</th>
                  <th>Elaborador</th>
                  <th>Data</th>
                  <th>Ações</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(({ change: c, status }) => {
                  const feitas = c.acoes.filter((a) => a.termino).length;
                  return (
                    <tr key={c.id}>
                      <td className="nowrap">
                        <Link to={`/mudancas/${c.id}`}>{c.id}</Link>
                      </td>
                      <td>{c.titulo}</td>
                      <td>{c.elaborador}</td>
                      <td className="nowrap">{formatDate(c.data)}</td>
                      <td className="nowrap">
                        {feitas}/{c.acoes.length}
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Mudancas;
