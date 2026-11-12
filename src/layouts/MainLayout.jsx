import { useState } from "react";
import { Menu } from "lucide-react";

import Sidebar from "../components/Sidebar";
import "./MainLayout.css";

const STORAGE_KEY = "sgi-sidebar:aberta";

function lerEstado() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true; // sem armazenamento: começa aberta
  }
}

function MainLayout({ children }) {
  const [aberta, setAberta] = useState(lerEstado);

  function alternar(valor) {
    setAberta(valor);
    try {
      localStorage.setItem(STORAGE_KEY, valor ? "1" : "0");
    } catch {
      // sem persistência: vale só até recarregar a página
    }
  }

  return (
    <div className="app-layout">
      <Sidebar aberta={aberta} onFechar={() => alternar(false)} />

      <main className="main-content">
        {!aberta && (
          <button
            type="button"
            className="menu-open-button no-print"
            aria-label="Abrir menu"
            onClick={() => alternar(true)}
          >
            <Menu size={20} />
          </button>
        )}

        {children}
      </main>
    </div>
  );
}

export default MainLayout;