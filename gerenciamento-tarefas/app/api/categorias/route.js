import { NextResponse } from 'next/server';
import pool from '@/db';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, descricao FROM categorias ORDER BY nome'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json({ mensagem: 'Erro ao listar categorias' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ mensagem: 'Corpo da requisição JSON inválido' }, { status: 400 });
    }

    const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
    const descricao = typeof body?.descricao === 'string' ? body.descricao.trim() : '';

    if (!nome) {
      return NextResponse.json({ mensagem: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
      [nome, descricao || null]
    );
    return NextResponse.json(
      { id: result.insertId, nome, descricao: descricao || null },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar categoria:', error);
    const status = error.code === 'ER_DUP_ENTRY' ? 409 : 500;
    return NextResponse.json(
      { mensagem: status === 409 ? 'Categoria já cadastrada' : 'Erro ao cadastrar categoria' },
      { status }
    );
  }
}
