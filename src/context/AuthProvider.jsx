import { useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { cadastrarUsuario, listarUsuarios } from "../utils/usuarios";

const SESSION_KEY = "sgi-auth:session:v1";

// Dados do usuário que o app pode usar (sem a senha).
function publico(u) {
  return { usuario: u.usuario, nome: u.nome, papel: u.papel, email: u.email};
}

function loadSession(usuarios) {
  try {
    const login = localStorage.getItem(SESSION_KEY);
    const achado = usuarios.find((u) => u.usuario === login);
    return achado ? publico(achado) : null;
  } catch {
    return null; // armazenamento indisponível: segue sem sessão
  }
}

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(listarUsuarios);
  const [user, setUser] = useState(() => loadSession(usuarios));
  const usuariosPublicos = useMemo(() => usuarios.map(publico), [usuarios]);

  const value = useMemo(
    () => ({
      user,
      usuarios: usuariosPublicos,

      // devolve true se entrou, false se usuário ou senha estão errados
      login(usuario, senha) {
        const achado = usuarios.find(
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

      criarUsuario(dados) {
        if (user?.papel !== "admin") {
          throw new Error("Somente administradores podem cadastrar usuários.");
        }
        const atualizados = cadastrarUsuario(dados, usuarios);
        setUsuarios(atualizados);
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
    [user, usuarios, usuariosPublicos],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}