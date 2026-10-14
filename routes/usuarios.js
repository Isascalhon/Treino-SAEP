// routes/usuarios.js - Rotas para gerenciamento de usuários
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, email FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ mensagem: 'Erro ao listar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, nome, email FROM usuarios WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
  }
});

// Cadastrar novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    
    // Verificar se todos os campos foram preenchidos
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar se o email já está em uso
    const [existingUsers] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ mensagem: 'Email já cadastrado' });
    }
    
    // Criptografar a senha
    const hashedSenha = await bcrypt.hash(senha, 10);
    
    // Salvar o usuário no banco
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashedSenha]
    );
    
    res.status(201).json({
      id: result.insertId,
      nome,
      email
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;
    
    // Verificar se o usuário existe
    const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // Verificar se o novo email já está em uso por outro usuário
    if (email) {
      const [emailInUse] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]);
      if (emailInUse.length > 0) {
        return res.status(400).json({ mensagem: 'Email já cadastrado para outro usuário' });
      }
    }
    
    // Atualizar os dados do usuário
    let query = 'UPDATE usuarios SET ';
    const values = [];
    
    if (nome) {
      query += 'nome = ?, ';
      values.push(nome);
    }
    
    if (email) {
      query += 'email = ?, ';
      values.push(email);
    }
    
    if (senha) {
      const hashedSenha = await bcrypt.hash(senha, 10);
      query += 'senha = ?, ';
      values.push(hashedSenha);
    }
    
    // Remover a última vírgula e espaço
    query = query.slice(0, -2);
    
    // Adicionar a cláusula WHERE
    query += ' WHERE id = ?';
    values.push(id);
    
    // Executar a atualização
    await pool.query(query, values);
    
    res.json({ mensagem: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar usuário' });
  }
});

// Excluir usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // Deletar o usuário
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir usuário' });
  }
});

module.exports = router;