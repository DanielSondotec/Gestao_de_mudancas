import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { canArchiveChange, RESUMO_STATUS, deriveSummaryStatus } from "../utils/changes";
import { formatDate } from "../utils/dates";
import { pode } from "../utils/permissoes";
import "../styles/ui.css";

const FILTROS = ["Todas", ...Object.values(RESUMO_STATUS)];

function Mudancas() {
  const { user } = useAuth();
  const { changes, archiveChange, restoreArchivedChange, deleteArchivedChange } = useChanges();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  const [aviso, setAviso] = useState("");
  const [processando, setProcessando] = useState("");
  const podeArquivar = pode(user, "arquivarMudanca");
  const podeExcluir = pode(user, "excluirMudanca");

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return changes
      .filter((c) => Boolean(c.arquivadaEm) === mostrarArquivadas)
      .map((c) => ({ change: c, status: deriveSummaryStatus(c) }))
      .filter(({ change: c, status }) => {
        if (filtro !== "Todas" && status !== filtro) return false;
        if (!q) return true;
        return [c.id, c.titulo, c.descricao, c.elaborador, c.aprovador]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.change.data.localeCompare(a.change.data));
  }, [changes, busca, filtro, mostrarArquivadas]);

  const ativas = changes.filter((change) => !change.arquivadaEm).length;
  const arquivadas = changes.length - ativas;

  async function excluirArquivada(change) {
    if (!window.confirm(`Excluir definitivamente ${change.id} e seus anexos? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setProcessando(change.id);
    setAviso("");
    try {
      await deleteArchivedChange(change.id);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível excluir a mudança.");
    } finally {
      setProcessando("");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>Mudanças cadastradas</h1>
          <p>{ativas} ativa(s) · {arquivadas} arquivada(s).</p>
        </div>
        <div className="page-actions">
          <Link to="/nova-mudanca" className="btn btn-primary">
            <Plus size={16} /> Nova mudança
          </Link>
        </div>
      </header>

      <div className="card">
        <div className="segmented" role="group" aria-label="Mostrar mudanças ativas ou arquivadas">
          <button
            type="button"
            className={!mostrarArquivadas ? "active" : ""}
            onClick={() => setMostrarArquivadas(false)}
          >
            Ativas ({ativas})
          </button>
          <button
            type="button"
            className={mostrarArquivadas ? "active" : ""}
            onClick={() => setMostrarArquivadas(true)}
          >
            Arquivadas ({arquivadas})
          </button>
        </div>
        {aviso && <div className="notice warn" role="alert" style={{ marginTop: 16 }}>{aviso}</div>}
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
                  {(podeArquivar || podeExcluir) && <th>Gerenciar</th>}
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
                      {(podeArquivar || podeExcluir) && (
                        <td className="nowrap">
                          {mostrarArquivadas ? (
                            <div className="page-actions" style={{ margin: 0 }}>
                              {podeArquivar && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  disabled={Boolean(processando)}
                                  onClick={() => restoreArchivedChange(c.id, user.nome || user.usuario)}
                                >
                                  <RotateCcw size={14} /> Restaurar
                                </button>
                              )}
                              {podeExcluir && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  disabled={Boolean(processando)}
                                  onClick={() => excluirArquivada(c)}
                                >
                                  <Trash2 size={14} /> Excluir
                                </button>
                              )}
                            </div>
                          ) : podeArquivar && canArchiveChange(c) ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                archiveChange(c.id, user.nome || user.usuario);
                                setAviso("");
                              }}
                            >
                              <Archive size={14} /> Arquivar
                            </button>
                          ) : podeArquivar ? (
                            <span className="hint">Disponível ao concluir/cancelar</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
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
