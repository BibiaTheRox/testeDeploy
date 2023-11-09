
const jwt = require("jsonwebtoken");
const senhaJwt = require("../src/senhaJwt");
const knex = require("../src/conexao");

const verificarLogin = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ mensagem: "Não autorizado!" });
    }

    const token = authorization.split(" ")[1];
    try {
        const { id } = jwt.verify(token, senhaJwt);
        const [usuario] = await knex("usuarios").where("id", id).select("*");

        if (!usuario) {
            return res.status(401).json({ mensagem: "Usuario não encontrado!" });
        }

        const { senha, ...userData } = usuario;

        req.usuario = userData;

        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

module.exports = verificarLogin;
