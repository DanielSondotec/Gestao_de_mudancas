// Papéis e permissões do sistema.

export const PAPEIS = {
  admin: "Administrador",
  gestor: "Gestor",
  gestor_area: "Gestor da área (SGI)",
  user: "Usuário",
};

const TODOS = ["admin", "gestor", "gestor_area", "user"];

// ação -> papéis que podem executá-la
export const PERMISSOES = {
  // qualquer usuário
  criarMudanca: TODOS, // preencher o formulário (FORM01)
  proporResolucao: TODOS, // propor resolução (só nas ações designadas a ele)

  // consulta geral
  verTodasMudancas: ["admin", "gestor", "gestor_area"],
  verHistorico: ["admin", "gestor", "gestor_area"],

  // gestor da plataforma
  editarMudanca: ["admin", "gestor"],
  detalharPlano: ["admin", "gestor"], // montar o plano 5W2H
  avaliarPlano: ["admin", "gestor"], // aprovar ou reprovar propostas

  // gestor da área (SGI)
  verificarEficacia: ["admin", "gestor_area"],

  // só o admin
  excluirMudanca: ["admin"],
  gerenciarUsuarios: ["admin"],
  configuracoes: ["admin"],
};

// pode(user, "avaliarPlano") -> true | false
export function pode(user, acao) {
  return Boolean(user && PERMISSOES[acao]?.includes(user.papel));
}

export const nomePapel = (papel) => PAPEIS[papel] ?? papel;