import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import "../styles/ui.css";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // volta para a página que a pessoa tentou abrir antes de ser mandada ao login
  const destino = location.state?.from ?? "/";

  function handleSubmit(e) {
    e.preventDefault();
    if (login(usuario, senha)) {
      navigate(destino, { replace: true });
    } else {
      setErro("Usuário ou senha incorretos.");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo">GM</div>
          <div>
            <h1>Gestão de Mudanças</h1>
            <span>Sistema SGI</span>
          </div>
        </div>

        {erro && (
          <div className="form-errors" role="alert">
            {erro}
          </div>
        )}

        <div className="field">
          <label htmlFor="usuario">Usuário</label>
          <input
            id="usuario"
            className="input"
            autoComplete="username"
            autoFocus
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="input"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!usuario.trim() || !senha}>
          <LogIn size={16} /> Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;