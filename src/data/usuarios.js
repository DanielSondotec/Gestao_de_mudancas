// Usuários do login local.
// ATENÇÃO: isto roda no navegador, e qualquer pessoa que abra o código
// consegue ver estas senhas. Serve para separar acessos em uso interno ou
// demonstração, não para proteger dados sensíveis.
//
// papel: "admin" | "gestor" | "gestor_area" | "user"
export const USUARIOS = [
  { usuario: "admin", senha: "123456", nome: "Administrador", papel: "admin", email: "admin@sondotecnica.com.br" },
  { usuario: "gestor", senha: "123456", nome: "Gestor", papel: "gestor", email: "gestor@exemplo.com" },
  { usuario: "gestorarea", senha: "123456", nome: "Gestor de Área", papel: "gestor_area", email: "gestorarea@exemplo.com" },
  { usuario: "user", senha: "123456", nome: "Usuário", papel: "user", email: "user@exemplo.com" },
];