import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { todayISO } from "../utils/dates";
import { nomePapel, PAPEIS } from "../utils/permissoes";
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
  const { changes, replaceAll, resetToSeed, deleteArchivedChanges } = useChanges();
  const { usuarios, criarUsuario } = useAuth();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null); // { tipo: "info" | "warn", texto }
  const [limpandoArquivo, setLimpandoArquivo] = useState(false);
  const quantidadeArquivada = changes.filter((change) => change.arquivadaEm).length;
  const [novoUsuario, setNovoUsuario] = useState({
    usuario: "",
    nome: "",
    email: "",
    senha: "",
    papel: "user",
  });

  function cadastrar(e) {
    e.preventDefault();
    try {
      criarUsuario(novoUsuario);
      setNovoUsuario({ usuario: "", nome: "", email: "", senha: "", papel: "user" });
      setMsg({ tipo: "info", texto: "Usuário cadastrado com sucesso." });
    } catch (error) {
      setMsg({ tipo: "warn", texto: error.message });
    }
  }

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
      await replaceAll(data);
      setMsg({ tipo: "info", texto: `${data.length} registro(s) importado(s).` });
    } catch (error) {
      setMsg({
        tipo: "warn",
        texto: error instanceof Error
          ? `Não foi possível importar: ${error.message}`
          : "Arquivo inválido. Use um backup exportado por este sistema.",
      });
    }
  }

  async function restaurar() {
    if (window.confirm("Restaurar os dados de exemplo? Os registros atuais serão substituídos.")) {
      try {
        await resetToSeed();
        setMsg({ tipo: "info", texto: "Dados de exemplo restaurados." });
      } catch (error) {
        setMsg({
          tipo: "warn",
          texto: error instanceof Error ? error.message : "Não foi possível restaurar os dados de exemplo.",
        });
      }
    }
  }

  async function limparArquivo() {
    if (quantidadeArquivada === 0 || limpandoArquivo) return;
    if (!window.confirm(`Excluir definitivamente ${quantidadeArquivada} mudança(s) arquivada(s) e seus anexos? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setLimpandoArquivo(true);
    setMsg(null);
    try {
      const removidas = await deleteArchivedChanges();
      setMsg({ tipo: "info", texto: `${removidas} mudança(s) arquivada(s) e seus anexos foram excluídos.` });
    } catch (error) {
      setMsg({
        tipo: "warn",
        texto: error instanceof Error ? error.message : "Não foi possível excluir os registros arquivados.",
      });
    } finally {
      setLimpandoArquivo(false);
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
        <h2>Usuários</h2>
        <p className="card-sub">
          Cadastre acessos para este navegador. Como o sistema não possui servidor, os usuários e senhas
          ficam salvos localmente e não são sincronizados entre computadores.
        </p>

        <form className="form-grid" onSubmit={cadastrar}>
          <div className="field">
            <label htmlFor="novo-usuario">Login</label>
            <input
              id="novo-usuario"
              className="input"
              autoComplete="off"
              value={novoUsuario.usuario}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="novo-nome">Nome completo</label>
            <input
              id="novo-nome"
              className="input"
              autoComplete="name"
              value={novoUsuario.nome}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="novo-email">E-mail</label>
            <input
              id="novo-email"
              type="email"
              className="input"
              autoComplete="email"
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nova-senha">Senha inicial</label>
            <input
              id="nova-senha"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              value={novoUsuario.senha}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="novo-papel">Perfil</label>
            <select
              id="novo-papel"
              className="input"
              value={novoUsuario.papel}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, papel: e.target.value })}
            >
              {Object.entries(PAPEIS).map(([papel, nome]) => (
                <option key={papel} value={papel}>{nome}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ alignSelf: "end" }}>
            <button type="submit" className="btn btn-primary">Cadastrar usuário</button>
          </div>
        </form>

        <div className="table-scroll" style={{ marginTop: 24 }}>
          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Perfil</th></tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.usuario}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.usuario}</td>
                  <td>{usuario.email}</td>
                  <td>{nomePapel(usuario.papel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Dados</h2>
        <p className="card-sub">
          Mudanças e histórico ficam no armazenamento local deste navegador; anexos são salvos separadamente.
          O backup JSON inclui os registros, mas não os arquivos anexados.
        </p>

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
            <h3>Excluir mudanças arquivadas</h3>
            <p>Remove definitivamente os {quantidadeArquivada} registros arquivados e seus anexos. Mudanças ativas não podem ser apagadas por esta opção.</p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={limparArquivo}
            disabled={quantidadeArquivada === 0 || limpandoArquivo}
          >
            <Trash2 size={16} /> {limpandoArquivo ? "Excluindo..." : "Excluir arquivo"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Configuracoes;
