// Usuários do login local.
// ATENÇÃO: isto roda no navegador, e qualquer pessoa que abra o código
// consegue ver estas senhas. Serve para separar acessos em uso interno ou
// demonstração, não para proteger dados sensíveis.
//
// papel: "admin" | "gestor" | "gestor_area" | "user"
export const USUARIOS = [
  { usuario: "daniel", senha: "123456", nome: "Daniel Neves", papel: "admin", email: "daniel.neves@sondotecnica.com.br" },
  { usuario: "geziel", senha: "123456", nome: "Geziel Lima", papel: "gestor", email: "geziel@exemplo.com" },
  { usuario: "fatima", senha: "123456", nome: "Maria de Fátima", papel: "gestor_area", email: "fatima@exemplo.com" },
  { usuario: "mayara", senha: "123456", nome: "Mayara Cavalcante de Paula", papel: "user", email: "mayara@exemplo.com" },
];