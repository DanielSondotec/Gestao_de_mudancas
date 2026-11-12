import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { pode } from "../utils/permissoes";
import "../styles/ui.css";

// Envolve uma página e só a mostra a quem tem a permissão pedida.
function RequirePermission({ permissao, children }) {
  const { user } = useAuth();

  if (!pode(user, permissao)) {
    return (
      <div className="card empty">
        <h3>Acesso restrito</h3>
        <p>Seu perfil não tem permissão para acessar esta página.</p>
        <p>
          <Link to="/">Voltar para a visão geral</Link>
        </p>
      </div>
    );
  }

  return children;
}

export default RequirePermission;