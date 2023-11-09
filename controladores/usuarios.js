
const bcrypt = require("bcrypt");
const knex = require("../src/conexao");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../src/senhaJwt");

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const emailExistente = await knex("usuarios").where("email", email);

        if (emailExistente.length > 0) {
            return res.status(400).json({ mensagem: "Email já existente!" });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const [usuario] = await knex("usuarios")
            .insert({ nome, email, senha: senhaCriptografada })
            .returning(["nome", "email"]);

        return res.status(201).json(usuario);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

const login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(500).json({ mensagem: "Todos os campos são obrigatórios!" });
    }

    try {
        const [usuario] = await knex("usuarios").where("email", email).select("*");

        if (!usuario) {
            return res.status(400).json({ mensagem: "Email ou senha inválida!" });
        }

        const { senha: senhaCriptografada, ...userData } = usuario;
        const senhaCorreta = await bcrypt.compare(senha, senhaCriptografada);

        if (!senhaCorreta) {
            return res.status(400).json({ mensagem: "Email ou senha inválida!" });
        }

        const token = jwt.sign({ id: userData.id }, senhaJwt, { expiresIn: "8h" });
        return res.json({
            usuario: userData,
            token
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

const detalharUsuario = async (req, res) => {
    try {
        const [usuario] = await knex("usuarios")
            .where("id", req.usuario.id)
            .select("id", "nome", "email");

        return res.json(usuario);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do Servidor" });
    }
};

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;
    const idDoUsuario = req.usuario.id;

    try {
        const emailExistente = await knex("usuarios")
            .where("email", email)
            .whereNot("id", idDoUsuario)
            .select();

        if (emailExistente.length > 0) {
            return res.status(400).json({ mensagem: "Email já cadastrado com outro usuário!" });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await knex("usuarios")
            .where("id", idDoUsuario)
            .update({ nome, email, senha: senhaCriptografada });

        return res.status(204).send();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
};

    

module.exports = {
    cadastrarUsuario,
    login, 
    detalharUsuario,
    atualizarUsuario
};