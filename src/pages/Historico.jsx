import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useChanges } from "../hooks/useChanges";
import { formatDateTime } from "../utils/dates";
import "../styles/ui.css";

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "criada", label: "Criações" },
  { value: "editada", label: "Edições" },
  { value: "acao", label: "Ações" },
  { value: "eficacia", label: "Eficácia" },
];

function Historico() {
  const { changes } = useChanges();
  const [tipo, setTipo] = useState("todos");

  const eventos = useMemo(
    () =>
      changes
        .flatMap((c) => c.historico.map((h) => ({ ...h, changeId: c.id, titulo: c.titulo })))
        .filter((h) => tipo === "todos" || h.tipo === tipo)
        .sort((a, b) => b.em.localeCompare(a.em)),
    [changes, tipo],
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>Histórico de mudanças</h1>
          <p>Linha do tempo de tudo o que aconteceu nos registros.</p>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filtrar por tipo">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={tipo === t.value ? "active" : ""}
                onClick={() => setTipo(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {eventos.length === 0 ? (
          <div className="empty">
            <h3>Nenhum evento</h3>
            <p>Não há eventos para este filtro.</p>
          </div>
        ) : (
          <ul className="timeline">
            {eventos.map((h) => (
              <li key={`${h.changeId}-${h.id}`}>
                <span className={`dot ${h.tipo}`} />
                <div>
                  <p>{h.texto}</p>
                  <small>
                    {formatDateTime(h.em)} ·{" "}
                  </small>
                  <Link to={`/mudancas/${h.changeId}`}>
                    {h.changeId} — {h.titulo}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Historico;
