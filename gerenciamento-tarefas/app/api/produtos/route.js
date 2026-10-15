import { NextResponse } from 'next/server';
import pool from '@/db';

const selectProdutos = `
  SELECT p.id, p.nome, p.descricao, p.preco, p.quantidade_estoque,
         p.categoria_id, c.nome AS categoria_nome
  FROM produtos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

export async function GET(request) {
  try {
    const categoriaId = new URL(request.url).searchParams.get('categoria_id');
    const query = categoriaId
      ? `${selectProdutos} WHERE p.categoria_id = ? ORDER BY p.nome`
      : `${selectProdutos} ORDER BY p.nome`;
    const [rows] = await pool.query(query, categoriaId ? [categoriaId] : []);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ mensagem: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nome, descricao, preco, quantidade_estoque, categoria_id } = await request.json();
    const precoNumero = Number(preco);
    const quantidade = Number(quantidade_estoque ?? 0);
    if (!nome?.trim() || !Number.isFinite(precoNumero) || precoNumero < 0 ||
        !Number.isInteger(quantidade) || quantidade < 0) {
      return NextResponse.json(
        { mensagem: 'Informe nome, preço válido e quantidade inteira não negativa' },
        { status: 400 }
      );
    }

    if (categoria_id != null) {
      const [categorias] = await pool.query('SELECT id FROM categorias WHERE id = ?', [categoria_id]);
      if (!categorias.length) {
        return NextResponse.json({ mensagem: 'Categoria não encontrada' }, { status: 400 });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, categoria_id)
       VALUES (?, ?, ?, ?, ?)`,
      [nome.trim(), descricao?.trim() || null, precoNumero, quantidade, categoria_id ?? null]
    );
    return NextResponse.json(
      { id: result.insertId, nome: nome.trim(), descricao: descricao?.trim() || null,
        preco: precoNumero, quantidade_estoque: quantidade, categoria_id: categoria_id ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    return NextResponse.json({ mensagem: 'Erro ao cadastrar produto' }, { status: 500 });
  }
}
