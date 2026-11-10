import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";

import { useChanges } from "../hooks/useChanges";
import { todayISO } from "../utils/dates";
import "../styles/ui.css";

// Validação mínima do arquivo importado: lista de objetos com os campos usados pelo app.
function isValidBackup(data) {
  return (
    Array.isArray(data) &&
    data.every(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.titulo === "string" &&
        typeof c.data === "string" &&
        Array.isArray(c.acoes) &&
        Array.isArray(c.historico) &&
        c.checklists &&
        c.respostas &&
        c.eficacia,
    )
  );
}

function Configuracoes() {
  const { changes, replaceAll, resetToSeed } = useChanges();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null); // { tipo: "info" | "warn", texto }

  function exportar() {
    const blob = new Blob([JSON.stringify(changes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sgi-mudancas-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ tipo: "info", texto: `${changes.length} registro(s) exportado(s).` });
  }

  async function importar(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isValidBackup(data)) throw new Error("formato inválido");
      if (!window.confirm(`Importar ${data.length} registro(s)? Os dados atuais serão substituídos.`)) return;
      replaceAll(data);
      setMsg({ tipo: "info", texto: `${data.length} registro(s) importado(s).` });
    } catch {
      setMsg({ tipo: "warn", texto: "Arquivo inválido. Use um backup exportado por este sistema." });
    }
  }

  function restaurar() {
    if (window.confirm("Restaurar os dados de exemplo? Os registros atuais serão substituídos.")) {
      resetToSeed();
      setMsg({ tipo: "info", texto: "Dados de exemplo restaurados." });
    }
  }

  function limpar() {
    if (window.confirm("Apagar TODAS as mudanças? Essa ação não pode ser desfeita (exporte um backup antes).")) {
      replaceAll([]);
      setMsg({ tipo: "info", texto: "Todos os registros foram apagados." });
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">SISTEMA SGI / GESTÃO</span>
          <h1>Configurações</h1>
          <p>Backup e gerenciamento dos dados (salvos neste navegador).</p>
        </div>
      </header>

      {msg && <div className={`notice ${msg.tipo}`}>{msg.texto}</div>}

      <section className="card">
        <h2>Dados</h2>
        <p className="card-sub">Os registros ficam salvos apenas neste navegador. Faça backups periódicos.</p>

        <div className="settings-row">
          <div>
            <h3>Exportar backup</h3>
            <p>Baixa todas as mudanças em um arquivo JSON.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={exportar}>
            <Download size={16} /> Exportar
          </button>
        </div>

        <div className="settings-row">
          <div>
            <h3>Importar backup</h3>
            <p>Substitui os dados atuais pelo conteúdo de um arquivo exportado anteriormente.</p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importar} />
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Importar
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h3>Restaurar dados de exemplo</h3>
            <p>Volta ao conjunto inicial (inclui a mudança real SGI-GMU-2026-04).</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={restaurar}>
            <RotateCcw size={16} /> Restaurar
          </button>
        </div>

        <div className="settings-row">
          <div>
            <h3>Apagar tudo</h3>
            <p>Remove todas as mudanças cadastradas.</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={limpar}>
            <Trash2 size={16} /> Apagar
          </button>
        </div>
      </section>
    </div>
  );
}

export default Configuracoes;
