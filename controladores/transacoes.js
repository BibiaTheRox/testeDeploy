
const jwt = require("jsonwebtoken");
const senhaJwt = require("../src/senhaJwt");
const knex = require("../src/conexao");

const listarTransacoes = async (req, res) => {
    const usuarioId = req.usuario.id;
    const categoriaFiltrada = req.query.filtro;

    try {
        if (categoriaFiltrada) {
            const categoria = await knex("categorias").select("id").where("descricao", categoriaFiltrada);

            if (categoria.length === 0) {
                return res.status(400).json({ mensagem: "Categoria não encontrada." });
            }
        }

        let query = knex
            .select(
                "transacoes.id",
                "transacoes.tipo",
                "transacoes.descricao",
                "transacoes.valor",
                "transacoes.data",
                "transacoes.usuario_id",
                "transacoes.categoria_id",
                "categorias.descricao as categoria_nome"
            )
            .from("transacoes")
            .innerJoin("categorias", "transacoes.categoria_id", "categorias.id")
            .where("transacoes.usuario_id", usuarioId);

        if (categoriaFiltrada) {
            query = query.andWhere("categorias.descricao", categoriaFiltrada);
        }

        const transacoes = await query;

        return res.status(200).json(transacoes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: error.message });
    }
};

const detalharTransacao = async (req, res) => {
    const { id } = req.params;
    const usuario = req.usuario;

    try {
        const [transacao] = await knex("transacoes").select("*").where("id", id);

        if (!transacao) {
            return res.status(404).json({ mensagem: 'Transação não encontrada' });
        }

        if (usuario.id !== transacao.usuario_id) {
            return res.status(404).json({ mensagem: 'Transação não pertence a este usuario' });
        }

        return res.json(transacao);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: error.message });
    }
};

const cadastrarTransacao = async (req, res) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body;
    const usuarioId = req.usuario.id;

    try {
        const novaTransacao = await knex("transacoes")
            .insert({
                descricao,
                valor,
                data,
                categoria_id,
                tipo,
                usuario_id: usuarioId
            })
            .returning(["*"]);

        return res.status(201).json(novaTransacao[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: error.message });
    }
};

const atualizarTransacao = async (req, res) => {
    const { id } = req.params;
    const { descricao, categoria_id, tipo, data, valor } = req.body;

    try {
        const atualizaTransacao = await knex("transacoes")
            .where("id", id)
            .update({
                descricao,
                categoria_id,
                tipo,
                data,
                valor
            });

        if (atualizaTransacao === 0) {
            return res.status(400).json({ mensagem: "Não foi possível editar os dados." });
        }

        return res.status(204).json();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Ocorreu um erro desconhecido. " + error.message });
    }
};

const deletarTransacao = async (req, res) => {
    const usuarioId = req.usuario.id;
    const transacaoId = req.params.id;

    try {
        const transacao = await knex("transacoes")
            .select("*")
            .where("id", transacaoId)
            .andWhere("usuario_id", usuarioId);

        if (transacao.length === 0) {
            return res.status(404).json({
                mensagem: "Transação não encontrada ou não pertence ao usuário.",
            });
        }

        await knex("transacoes").where("id", transacaoId).del();

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: error.message });
    }
};

const extrato = async (req, res) => {
    const idDoUsuario = req.usuario.id;

    try {
        const resultadoExtrato = await knex.raw(`
            select
                (select sum(valor) from transacoes where usuario_id = ? AND tipo = 'entrada') as entrada,
                (select sum(valor) from transacoes where usuario_id = ? AND tipo = 'saida') as saida
        `, [idDoUsuario, idDoUsuario]);

        const somaDasEntradas = resultadoExtrato.rows[0].entrada || 0;
        const somaDasSaidas = resultadoExtrato.rows[0].saida || 0;

        const somaTotal = somaDasEntradas - somaDasSaidas;

        return res.status(200).json({
            entrada: somaDasEntradas,
            saida: somaDasSaidas,
            saldoTotal: somaTotal
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

module.exports = {
    listarTransacoes,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    deletarTransacao,
    extrato
};
