import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  ListChecks,
  History,
  Settings
} from "lucide-react";

import "./Sidebar.css";

function Sidebar() {
  const menuItems = [
    {
      title: "Visão geral",
      icon: LayoutDashboard,
      path: "/"
    },
    {
      title: "Mudanças",
      icon: ClipboardList,
      path: "/mudancas"
    },
    {
      title: "Nova mudança",
      icon: PlusCircle,
      path: "/nova-mudanca"
    },
    {
      title: "Ações",
      icon: ListChecks,
      path: "/acoes"
    },
    {
      title: "Histórico",
      icon: History,
      path: "/historico"
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">GM</div>

        <div>
          <h2>Gestão de Mudanças</h2>
          <span>Sistema SGI</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">MENU PRINCIPAL</span>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
                <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                }
                >
                <Icon size={19} />
                <span>{item.title}</span>
                </NavLink>
            );
            })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
        >
          <Settings size={19} />
          <span>Configurações</span>
        </NavLink>

        <div className="sidebar-user">
          <div className="user-avatar">U</div>

          <div className="user-info">
            <strong>Usuário</strong>
            <span>Gestor do sistema</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
