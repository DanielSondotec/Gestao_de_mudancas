import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { USUARIOS } from "../src/data/usuarios.js";
import { cadastrarUsuario, listarUsuarios } from "../src/utils/usuarios.js";

let storage;

beforeEach(() => {
  storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
});

test("cadastra usuário e mantém o cadastro após recarregar a lista", () => {
  const usuario = {
    usuario: " Novo.Usuario ",
    senha: "segredo123",
    nome: "Novo Usuário",
    email: "NOVO@EXEMPLO.COM",
    papel: "gestor",
  };

  const atualizados = cadastrarUsuario(usuario, listarUsuarios());

  assert.equal(atualizados.length, USUARIOS.length + 1);
  assert.deepEqual(listarUsuarios().at(-1), {
    usuario: "novo.usuario",
    senha: "segredo123",
    nome: "Novo Usuário",
    email: "novo@exemplo.com",
    papel: "gestor",
  });
});

test("rejeita login duplicado sem alterar a lista salva", () => {
  const usuarios = listarUsuarios();
  assert.throws(
    () => cadastrarUsuario({
      usuario: "DANIEL",
      senha: "senha123",
      nome: "Outro Daniel",
      email: "outro@exemplo.com",
      papel: "user",
    }, usuarios),
    /Já existe um usuário com esse login/,
  );
  assert.equal(listarUsuarios().length, USUARIOS.length);
});

test("rejeita senha curta e perfil inválido", () => {
  const usuarios = listarUsuarios();
  const usuario = {
    usuario: "novo",
    senha: "123",
    nome: "Novo",
    email: "novo@exemplo.com",
    papel: "user",
  };

  assert.throws(() => cadastrarUsuario(usuario, usuarios), /pelo menos 6 caracteres/);
  assert.throws(
    () => cadastrarUsuario({ ...usuario, senha: "123456", papel: "desconhecido" }, usuarios),
    /perfil válido/,
  );
});
