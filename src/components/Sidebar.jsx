import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  ListChecks,
  History,
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { pode, nomePapel } from "../utils/permissoes";
import "./Sidebar.css";

// "permissao": se existir, só aparece para quem tem essa permissão
const menuItems = [
  { title: "Visão geral", icon: LayoutDashboard, path: "/" },
  { title: "Mudanças", icon: ClipboardList, path: "/mudancas" },
  { title: "Nova mudança", icon: PlusCircle, path: "/nova-mudanca", permissao: "criarMudanca" },
  { title: "Ações", icon: ListChecks, path: "/acoes" },
  { title: "Histórico", icon: History, path: "/historico", permissao: "verHistorico" }
];

const linkClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;

function Sidebar({ aberta, onFechar }) {
  const { user, logout } = useAuth();

  const visiveis = menuItems.filter((item) => !item.permissao || pode(user, item.permissao));

  return (
    <aside className={`sidebar ${aberta ? "" : "fechada"}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">GM</div>

          <div>
            <h2>Gestão de Mudanças</h2>
            <span>Sistema SGI</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={onFechar}
            aria-label="Esconder menu"
            title="Esconder menu"
          >
            <ChevronLeft size={18} />
          </button>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">MENU PRINCIPAL</span>

        <nav className="sidebar-nav">
          {visiveis.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={linkClass}
              >
                <Icon size={19} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        {pode(user, "configuracoes") && (
          <NavLink to="/configuracoes" className={linkClass}>
            <Settings size={19} />
            <span>Configurações</span>
          </NavLink>
        )}

        <button type="button" className="sidebar-link sidebar-logout" onClick={logout}>
          <LogOut size={19} />
          <span>Sair</span>
        </button>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.nome?.[0] ?? "?"}</div>

          <div className="user-info">
            <strong>{user?.nome ?? "—"}</strong>
            <span>{nomePapel(user?.papel)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;