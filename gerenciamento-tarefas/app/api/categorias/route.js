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
    const { nome, descricao } = await request.json();
    if (!nome?.trim()) {
      return NextResponse.json({ mensagem: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
      [nome.trim(), descricao?.trim() || null]
    );
    return NextResponse.json(
      { id: result.insertId, nome: nome.trim(), descricao: descricao?.trim() || null },
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
