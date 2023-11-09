
const bcrypt = require("bcrypt");
const pool = require("../src/conexao");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../src/senhaJwt");

const cadastrarUsuario = async (req, res) => {
    const {nome, email, senha} = req.body;

    try {
        const emailExistente = await pool.query("select * from usuarios where email = $1", [email]);

        if (emailExistente.rowCount > 0) {
            return res.status(400).json({mensagem: "Email já existente!"})
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const query = `
            insert into usuarios (nome, email, senha)
            values ($1, $2, $3) returning *
        `;

        const {rows} = await pool.query(query, [nome, email, senhaCriptografada]);

        const {senha: _ , ...usuario} = rows[0];

        return res.status(201).json(usuario);
        
    } catch (error) {
        return res.status(500).json({mensagem: "Erro interno do servidor!"})    
    }
}

const login = async (req, res) => {

    const {email, senha} = req.body;

    if (!email || !senha) {
        return res.status(500).json({mensagem: "Todos os campos são obrigatórios!"})
    }

    try {
        const {rows, rowCount} = await pool.query(
        "select * from usuarios where email = $1", [email]);

        if (rowCount === 0) {
            return res.status(400).json({mensagem: "Email ou senha inválida!"})
        }

        const {senha: senhaCriptografada, ...usuario} = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, senhaCriptografada);

        if (!senhaCorreta) {
            return res.status(400).json({mensagem: "Email ou senha inválida!"})
        }

        const token = jwt.sign({id: usuario.id}, senhaJwt, {expiresIn: "8h"});
            return res.json({
                usuario,
                token
            });
                 
    } catch (error) {
        return res.status(500).json({mensagem: "Erro interno do servidor!"})
    }
}

const detalharUsuario = async (req, res) => {

    try {
        const {rows: usuarios} = await pool.query(
            "select id, nome, email from usuarios where id = $1", 
        [req.usuario.id])

        return res.json(usuarios[0]);

    } catch (error) {
        return res.status(500).json({mensagem: "Erro interno do Servidor"});  
    }
}

const atualizarUsuario =  async (req, res) => {
    const {nome, email, senha} = req.body;
    
    const idDoUsuario = req.usuario.id;
    
    try {
    const emailExistente = await pool.query(
    "select * from usuarios where email = $1 and id <> $2",
    [email, idDoUsuario]);
    
    if (emailExistente.rowCount > 0) {
        return res.status(400).json({ mensagem: "Email já cadastrado com outro usuário!" });
    }       
    
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    
    const queryAtualizarUsuario = `
        update usuarios 
        set nome = $1, email = $2, senha = $3
        where id = $4
        `;
    
    await pool.query(queryAtualizarUsuario, 
    [nome, email, senhaCriptografada, idDoUsuario]);
    
        return res.status(204).send();
    
    } catch (error) {
         return res.status(500).json({ mensagem: "Erro interno do servidor!" });
    }
}
    

module.exports = {
    cadastrarUsuario,
    login, 
    detalharUsuario,
    atualizarUsuario
};