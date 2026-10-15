import { NextResponse } from 'next/server';
import pool from '@/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { nome, descricao } = await request.json();
    if (!nome?.trim()) {
      return NextResponse.json({ mensagem: 'Nome da categoria é obrigatório' }, { status: 400 });
    }
    const [result] = await pool.query(
      'UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?',
      [nome.trim(), descricao?.trim() || null, id]
    );
    if (!result.affectedRows) {
      return NextResponse.json({ mensagem: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ id: Number(id), nome: nome.trim(), descricao: descricao?.trim() || null });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ mensagem: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const [result] = await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return NextResponse.json({ mensagem: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ mensagem: 'Categoria excluída' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ mensagem: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
