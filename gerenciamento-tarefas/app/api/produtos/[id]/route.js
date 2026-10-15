import { NextResponse } from 'next/server';
import pool from '@/db';

const selectProduto = `
  SELECT p.id, p.nome, p.descricao, p.preco, p.quantidade_estoque,
         p.categoria_id, c.nome AS categoria_nome
  FROM produtos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.id = ?
`;

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query(selectProduto, [id]);
    if (!rows.length) {
      return NextResponse.json({ mensagem: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ mensagem: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const columns = {
      nome: body.nome?.trim(),
      descricao: body.descricao?.trim() || null,
      preco: body.preco === undefined ? undefined : Number(body.preco),
      quantidade_estoque: body.quantidade_estoque === undefined
        ? undefined
        : Number(body.quantidade_estoque),
      categoria_id: body.categoria_id,
    };
    const updates = Object.entries(columns).filter(([key, value]) =>
      value !== undefined && (key !== 'descricao' || Object.hasOwn(body, 'descricao'))
    );
    if (!updates.length) {
      return NextResponse.json({ mensagem: 'Nenhum campo para atualizar' }, { status: 400 });
    }
    if (columns.nome === '') {
      return NextResponse.json({ mensagem: 'Nome não pode ficar vazio' }, { status: 400 });
    }
    if (columns.preco !== undefined && (!Number.isFinite(columns.preco) || columns.preco < 0)) {
      return NextResponse.json({ mensagem: 'Preço inválido' }, { status: 400 });
    }
    if (columns.quantidade_estoque !== undefined &&
        (!Number.isInteger(columns.quantidade_estoque) || columns.quantidade_estoque < 0)) {
      return NextResponse.json({ mensagem: 'Quantidade inválida' }, { status: 400 });
    }
    if (columns.categoria_id !== undefined && columns.categoria_id !== null) {
      const [categorias] = await pool.query('SELECT id FROM categorias WHERE id = ?', [columns.categoria_id]);
      if (!categorias.length) {
        return NextResponse.json({ mensagem: 'Categoria não encontrada' }, { status: 400 });
      }
    }

    const setClause = updates.map(([key]) => `${key} = ?`).join(', ');
    const values = updates.map(([, value]) => value);
    const [result] = await pool.query(`UPDATE produtos SET ${setClause} WHERE id = ?`, [...values, id]);
    if (!result.affectedRows) {
      return NextResponse.json({ mensagem: 'Produto não encontrado' }, { status: 404 });
    }
    const [rows] = await pool.query(selectProduto, [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ mensagem: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const [result] = await pool.query('DELETE FROM produtos WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return NextResponse.json({ mensagem: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ mensagem: 'Produto excluído' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ mensagem: 'Erro ao excluir produto' }, { status: 500 });
  }
}
