const pool = require("../src/conexao");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../src/senhaJwt");

const listarTransacoes = async (req, res) => {
    const usuarioId = req.usuario.id;
    const categoriaFiltrada = req.query.filtro; 

    try {
        if (categoriaFiltrada) {
            const categoriaQuery = "select id from categorias where descricao = $1";
            const categoriaResult = await pool.query(categoriaQuery, [categoriaFiltrada]);

            if (categoriaResult.rowCount === 0) {
                return res.status(400).json({ mensagem: "Categoria não encontrada." });
            }
        }

        let query = `
            SELECT 
            transacoes.id,
            transacoes.tipo,
            transacoes.descricao,
            transacoes.valor,
            transacoes.data,
            transacoes.usuario_id,
            transacoes.categoria_id,
            categorias.descricao as categoria_nome
            from transacoes 
            inner join categorias on transacoes.categoria_id = categorias.id
            where transacoes.usuario_id = $1
        `;

        const params = [usuarioId];

        if (categoriaFiltrada) {
            query += " and categorias.descricao = $2";
            params.push(categoriaFiltrada);
        }

        const { rows } = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ mensagem: error.message });
    }
}


const detalharTransacao = async (req, res) => {
    const { id } = req.params
    const usuario = req.usuario;


    try {
        const { rows, rowCount } = await pool.query('select * from transacoes where id = $1', [id])

        if (rowCount < 1) {
            return res.status(404).json({ mensagem: 'Transação não encontrada' })
        }


        if (usuario.id !== rows[0].usuario_id) {
            return res.status(404).json({ mensagem: 'Transação não pertence a este usuario' })
        }

        return res.json(rows[0])
    } catch (error) {
        return res.status(500).json({ mensagem: error.mensage })
    }
};


const cadastrarTransacao = async (req, res) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body;
    const usuarioId = req.usuario.id;

    try {
        const novaTransacao = await pool.query(
            `
            INSERT INTO transacoes (descricao, valor, data, categoria_id, tipo, usuario_id) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *, (SELECT descricao FROM categorias WHERE id = $4) AS categoria_nome;
            `,
      [descricao, valor, data, categoria_id, tipo, usuarioId]
    );
            [descricao, valor, data, categoria_id, tipo, usuarioId]

        return res.status(201).json(novaTransacao.rows[0]);
    } catch (error) {
        return res.status(500).json({ mensagem: error.message });
    }
}



const atualizarTransacao = async (req, res) => {
    const { id } = req.params;
    const { descricao, categoria_id, tipo, data, valor } = req.body;

    try {
        const queryTransacao = "update transacoes set descricao = $1, categoria_id = $2, tipo = $3, data = $4, valor = $5  where id = $6";
        const atualizaTransacao = await pool.query(queryTransacao, [descricao, categoria_id, tipo, data, valor, id]);

        if (atualizaTransacao.rowCount === 0) {
            return res.status(400).json({ mensagem: "Não foi possível editar os dados." });
        }

        return res.status(204).json();
    } catch (error) {
        return res.status(500).json({ mensagem: "Ocorreu um erro desconhecido. " + error.message });
    }
};

const deletarTransacao = async (req, res) => {
    const usuarioId = req.usuario.id;
    const transacaoId = req.params.id;

    try {
        const transacao = await pool.query(
            "SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2",
            [transacaoId, usuarioId]
        );

        if (transacao.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Transação não encontrada ou não pertence ao usuário.",
            });
        }

        await pool.query("DELETE FROM transacoes WHERE id = $1", [transacaoId]);

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: error.mensage });
    }
};


const extrato = async (req, res) => {
    const idDoUsuario = req.usuario.id; 

    try {
        
        const queryExtrato = `
            select
                (select sum(valor) from transacoes where usuario_id = $1 AND tipo = 'entrada') as entrada,
                (select sum(valor) from transacoes where usuario_id = $1 AND tipo = 'saida') as saida
        `;
        
        const resultadoExtrato = await pool.query(queryExtrato, [idDoUsuario]);
        
        const somaDasEntradas = resultadoExtrato.rows[0].entrada || 0;
        const somaDasSaidas = resultadoExtrato.rows[0].saida || 0;

        const somaTotal = somaDasEntradas - somaDasSaidas;

        return res.status(200).json({
            entrada: somaDasEntradas,
            saida: somaDasSaidas,
            saldoTotal: somaTotal
        });
    } catch (error) {
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
