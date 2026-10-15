// routes/tarefas.js - Rotas para gerenciamento de tarefas
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar todas as tarefas (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { usuario_id, status } = req.query;
    
    let query = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id, u.nome as usuario_nome
      FROM tarefas t
      INNER JOIN usuarios u ON t.usuario_id = u.id
    `;
    
    const values = [];
    
    // Adicionar filtros se houver
    if (usuario_id || status) {
      query += ' WHERE';
      
      if (usuario_id) {
        query += ' t.usuario_id = ?';
        values.push(usuario_id);
      }
      
      if (status) {
        if (usuario_id) {
          query += ' AND';
        }
        query += ' t.status = ?';
        values.push(status);
      }
    }
    
    query += ' ORDER BY t.id DESC';
    
    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ mensagem: 'Erro ao listar tarefas' });
  }
});

// Buscar tarefa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id, u.nome as usuario_nome
       FROM tarefas t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar tarefa' });
  }
});

// Cadastrar nova tarefa
router.post('/', async (req, res) => {
  try {
    const { titulo, descricao, usuario_id, status } = req.body;
    
    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!titulo || !usuario_id) {
      return res.status(400).json({ mensagem: 'Título e responsável são obrigatórios' });
    }
    
    // Verificar se o usuário existe
    const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
    if (existingUser.length === 0) {
      return res.status(400).json({ mensagem: 'Usuário responsável não encontrado' });
    }
    
    // Inserir a tarefa no banco
    const [result] = await pool.query(
      'INSERT INTO tarefas (titulo, descricao, usuario_id, status) VALUES (?, ?, ?, ?)',
      [titulo, descricao || '', usuario_id, status || 'Pendente']
    );
    
    // Buscar a tarefa recém-criada com o nome do usuário
    const [newTask] = await pool.query(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id, u.nome as usuario_nome
       FROM tarefas t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Erro ao cadastrar tarefa:', error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar tarefa' });
  }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, usuario_id, status } = req.body;
    
    // Verificar se a tarefa existe
    const [existingTask] = await pool.query('SELECT id FROM tarefas WHERE id = ?', [id]);
    if (existingTask.length === 0) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    
    // Verificar se o usuário existe, se foi fornecido
    if (usuario_id) {
      const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
      if (existingUser.length === 0) {
        return res.status(400).json({ mensagem: 'Usuário responsável não encontrado' });
      }
    }
    
    // Atualizar os dados da tarefa
    let query = 'UPDATE tarefas SET ';
    const values = [];
    
    if (titulo !== undefined) {
      query += 'titulo = ?, ';
      values.push(titulo);
    }
    
    if (descricao !== undefined) {
      query += 'descricao = ?, ';
      values.push(descricao);
    }
    
    if (usuario_id !== undefined) {
      query += 'usuario_id = ?, ';
      values.push(usuario_id);
    }
    
    if (status !== undefined) {
      query += 'status = ?, ';
      values.push(status);
    }
    
    if (values.length === 0) {
      return res.status(400).json({ mensagem: 'Informe ao menos um campo para atualizar' });
    }

    // Remover a última vírgula e espaço
    query = query.slice(0, -2);
    
    // Adicionar a cláusula WHERE
    query += ' WHERE id = ?';
    values.push(id);
    
    // Executar a atualização
    await pool.query(query, values);
    
    // Buscar a tarefa atualizada
    const [updatedTask] = await pool.query(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id, u.nome as usuario_nome
       FROM tarefas t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar tarefa' });
  }
});

// Atualizar apenas o status da tarefa
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Verificar se o status foi fornecido
    if (!status) {
      return res.status(400).json({ mensagem: 'O status é obrigatório' });
    }
    
    // Verificar se a tarefa existe
    const [existingTask] = await pool.query('SELECT id FROM tarefas WHERE id = ?', [id]);
    if (existingTask.length === 0) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    
    // Verificar se o status é válido
    if (!['Pendente', 'Em andamento', 'Concluída'].includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido' });
    }
    
    // Atualizar o status da tarefa
    await pool.query('UPDATE tarefas SET status = ? WHERE id = ?', [status, id]);
    
    // Buscar a tarefa atualizada
    const [updatedTask] = await pool.query(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id, u.nome as usuario_nome
       FROM tarefas t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar status da tarefa' });
  }
});

// Excluir tarefa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a tarefa existe
    const [existingTask] = await pool.query('SELECT id FROM tarefas WHERE id = ?', [id]);
    if (existingTask.length === 0) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    
    // Excluir a tarefa
    await pool.query('DELETE FROM tarefas WHERE id = ?', [id]);
    
    res.json({ mensagem: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir tarefa' });
  }
});

module.exports = router;
