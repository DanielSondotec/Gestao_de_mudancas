import { Routes, Route, Link, Navigate, Outlet } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../hooks/useAuth";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Mudancas from "../pages/Mudancas";
import MudancaDetalhe from "../pages/MudancaDetalhe";
import MudancaForm from "../pages/MudancaForm";
import Acoes from "../pages/Acoes";
import Historico from "../pages/Historico";
import Configuracoes from "../pages/Configuracoes";
import RequirePermission from "../components/RequirePermission";

function NotFound() {
  return (
    <div className="card empty">
      <h3>Página não encontrada</h3>
      <p>
        <Link to="/">Voltar para a visão geral</Link>
      </p>
    </div>
  );
}

// Layout das páginas internas: exige login e mostra a Sidebar.
function Protegido() {
  return (
    <RequireAuth>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </RequireAuth>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<Protegido />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mudancas" element={<Mudancas />} />
        <Route path="/mudancas/:id" element={<MudancaDetalhe />} />
        <Route 
          path="/mudancas/:id/editar"
          element={
          <RequirePermission permissao="editarMudanca">
            <MudancaForm />
          </RequirePermission>
        } />
        <Route
          path="/nova-mudanca"
          element={
            <RequirePermission permissao="criarMudanca">
              <MudancaForm />
            </RequirePermission>
          } />
        <Route path="/acoes" element={<Acoes />} />
        <Route
          path="/historico"
          element={
            <RequirePermission permissao="verHistorico">
              <Historico />
            </RequirePermission>
          } />
        <Route
          path="/configuracoes"
          element={
            <RequirePermission permissao="configuracoes">
              <Configuracoes />
            </RequirePermission>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;