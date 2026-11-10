import { useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { USUARIOS } from "../data/usuarios";

const SESSION_KEY = "sgi-auth:session:v1";

// Dados do usuário que o app pode usar (sem a senha).
function publico(u) {
  return { usuario: u.usuario, nome: u.nome, perfil: u.perfil };
}

function loadSession() {
  try {
    const login = localStorage.getItem(SESSION_KEY);
    const achado = USUARIOS.find((u) => u.usuario === login);
    return achado ? publico(achado) : null;
  } catch {
    return null; // armazenamento indisponível: segue sem sessão
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  const value = useMemo(
    () => ({
      user,

      // devolve true se entrou, false se usuário ou senha estão errados
      login(usuario, senha) {
        const achado = USUARIOS.find(
          (u) => u.usuario === usuario.trim().toLowerCase() && u.senha === senha,
        );
        if (!achado) return false;
        try {
          localStorage.setItem(SESSION_KEY, achado.usuario);
        } catch {
          // sem persistência: a sessão vale só até recarregar a página
        }
        setUser(publico(achado));
        return true;
      },

      logout() {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          // nada a fazer
        }
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}