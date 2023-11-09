
const pool = require("../src/conexao");

const listarCategorias = async (req, res) => {

    try {
        const query = "select id, descricao from categorias";

        const { rows } = await pool.query(query);
        return res.status(200).json(rows);
        
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
}

module.exports = listarCategorias;
