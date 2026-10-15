import { NextResponse } from 'next/server';
import pool from '@/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.titulo, t.descricao, t.status, t.usuario_id,
             u.nome AS usuario_nome
      FROM tarefas t 
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ORDER BY t.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    return NextResponse.json({ mensagem: 'Erro ao buscar tarefas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { titulo, descricao, status, usuario_id } = await request.json();
    if (!titulo?.trim() || !usuario_id) {
      return NextResponse.json(
        { mensagem: 'Título e responsável são obrigatórios' },
        { status: 400 }
      );
    }

    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [usuario_id]
    );
    if (!usuarios.length) {
      return NextResponse.json(
        { mensagem: 'Usuário responsável não encontrado' },
        { status: 400 }
      );
    }

    const statusTarefa = status || 'Pendente';
    if (!['Pendente', 'Em andamento', 'Concluída'].includes(statusTarefa)) {
      return NextResponse.json({ mensagem: 'Status inválido' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO tarefas (titulo, descricao, status, usuario_id) VALUES (?, ?, ?, ?)',
      [titulo.trim(), descricao || '', statusTarefa, usuario_id]
    );
    
    return NextResponse.json({ 
      id: result.insertId, 
      titulo: titulo.trim(),
      descricao: descricao || '',
      status: statusTarefa,
      usuario_id 
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar tarefa:', error);
    return NextResponse.json({ mensagem: 'Erro ao cadastrar tarefa' }, { status: 500 });
  }
}
