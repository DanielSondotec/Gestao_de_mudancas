import { USUARIOS } from "../data/usuarios.js";
import { PAPEIS } from "./permissoes.js";

const USERS_STORAGE_KEY = "sgi-auth:users:v1";
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUser(user) {
  return (
    user &&
    typeof user.usuario === "string" &&
    typeof user.senha === "string" &&
    typeof user.nome === "string" &&
    typeof user.email === "string" &&
    Object.hasOwn(PAPEIS, user.papel)
  );
}

function carregarUsuariosAdicionais() {
  let raw;
  try {
    raw = localStorage.getItem(USERS_STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let adicionais;
  try {
    adicionais = JSON.parse(raw);
  } catch {
    throw new Error("Não foi possível ler os usuários salvos neste navegador.");
  }

  if (!Array.isArray(adicionais) || !adicionais.every(isValidUser)) {
    throw new Error("A lista de usuários salva neste navegador está inválida.");
  }

  return adicionais;
}

export function listarUsuarios() {
  return [...USUARIOS, ...carregarUsuariosAdicionais()];
}

export function cadastrarUsuario(dados, usuariosAtuais) {
  const novoUsuario = {
    usuario: dados.usuario.trim().toLowerCase(),
    senha: dados.senha,
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    papel: dados.papel,
  };

  if (!novoUsuario.usuario || !novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
    throw new Error("Preencha todos os campos.");
  }
  if (!USERNAME_PATTERN.test(novoUsuario.usuario)) {
    throw new Error("O usuário deve conter apenas letras minúsculas, números, ponto, hífen ou sublinhado.");
  }
  if (!EMAIL_PATTERN.test(novoUsuario.email)) {
    throw new Error("Informe um e-mail válido.");
  }
  if (novoUsuario.senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  if (!Object.hasOwn(PAPEIS, novoUsuario.papel)) {
    throw new Error("Selecione um perfil válido.");
  }
  if (usuariosAtuais.some((user) => user.usuario.toLowerCase() === novoUsuario.usuario)) {
    throw new Error("Já existe um usuário com esse login.");
  }
  if (usuariosAtuais.some((user) => user.email?.toLowerCase() === novoUsuario.email)) {
    throw new Error("Já existe um usuário com esse e-mail.");
  }

  const usuariosAdicionais = [
    ...usuariosAtuais.filter((user) => !USUARIOS.some((seed) => seed.usuario === user.usuario)),
    novoUsuario,
  ];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usuariosAdicionais));
  return [...usuariosAtuais, novoUsuario];
}
