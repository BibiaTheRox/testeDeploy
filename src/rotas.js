
const express = require ("express");
const {cadastrarUsuario, login, detalharUsuario, atualizarUsuario} = require("../controladores/usuarios");
const verificarLogin = require("../intermediarios/autenticacao");
const listarCategorias = require("../controladores/categorias");
const {listarTransacoes, detalharTransacao, cadastrarTransacao, atualizarTransacao, deletarTransacao, extrato} = require("../controladores/transacoes");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);
rotas.post("/login", login);

rotas.use(verificarLogin);

rotas.get("/usuario", detalharUsuario);
rotas.put("/usuario", atualizarUsuario);
rotas.get("/categoria", listarCategorias);
rotas.get("/transacao", listarTransacoes);
rotas.post("/transacao", cadastrarTransacao);
rotas.get("/transacao/extrato", extrato);
rotas.get("/transacao/:id", detalharTransacao);
rotas.put("/transacao/:id", atualizarTransacao);
rotas.delete("/transacao/:id", deletarTransacao);



module.exports = rotas;