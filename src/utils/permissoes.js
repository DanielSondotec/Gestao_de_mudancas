
// Papéis disponíveis no sistema.
export const PAPEIS = {
  admin: "Administrador",
  gestor: "Gestor da plataforma",
  gestor_area: "Gestor da área (SGI)",
  user: "Usuário",
};

// Todos os perfis cadastrados.
const TODOS = ["admin", "gestor", "gestor_area", "user"];

// Perfis com acesso geral à gestão da plataforma.
const GESTORES = ["admin", "gestor"];

// Perfis que podem consultar todas as mudanças.
const GESTORES_CONSULTA = ["admin", "gestor", "gestor_area"];

// Ação -> perfis autorizados.
export const PERMISSOES = {
  // Abertura de mudanças
  criarMudanca: TODOS,

  // Proposta de resolução:
  // Além do perfil, a operação deverá verificar se a pessoa
  // está designada para aquele plano de ação.
  proporResolucao: TODOS,

  // Consulta
  verTodasMudancas: GESTORES_CONSULTA,
  verHistorico: GESTORES_CONSULTA,
  verMinhasAcoes: TODOS,
  verTodasAcoes: GESTORES_CONSULTA,

  // Gestão da plataforma
  editarMudanca: GESTORES,
  detalharPlano: GESTORES,
  avaliarPlano: GESTORES,

  // Gestor da área (SGI)
  verificarEficacia: ["admin", "gestor_area"],

  // Administração exclusiva
  arquivarMudanca: ["admin"],
  excluirMudanca: ["admin"],
  gerenciarUsuarios: ["admin"],
  configuracoes: ["admin"],
};

// Verifica se o usuário possui determinada permissão.
export function pode(user, acao) {
  if (!user || !user.papel) return false;

  return PERMISSOES[acao]?.includes(user.papel) ?? false;
}

// Retorna o nome amigável do perfil.
export const nomePapel = (papel) => PAPEIS[papel] ?? papel;
