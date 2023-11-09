
const knex = require("../src/conexao");

const listarCategorias = async (req, res) => {
    try {
        const categorias = await knex.select("id", "descricao").from("categorias");
        return res.status(200).json(categorias);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

module.exports = listarCategorias;

