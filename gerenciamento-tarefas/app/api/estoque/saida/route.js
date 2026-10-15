import { NextResponse } from 'next/server';
import pool from '@/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT m.id, m.produto_id, p.nome AS produto, m.quantidade,
             m.observacao, m.criado_em
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      WHERE m.tipo = 'saida'
      ORDER BY m.criado_em DESC, m.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao consultar saídas de estoque:', error);
    return NextResponse.json({ mensagem: 'Erro ao consultar saídas de estoque' }, { status: 500 });
  }
}

export async function POST(request) {
  const connection = await pool.getConnection();
  try {
    const { produto_id, quantidade, observacao } = await request.json();
    const produtoId = Number(produto_id);
    const quantidadeSaida = Number(quantidade);
    if (!Number.isInteger(produtoId) || produtoId <= 0 ||
        !Number.isInteger(quantidadeSaida) || quantidadeSaida <= 0) {
      return NextResponse.json(
        { mensagem: 'Produto e quantidade inteira maior que zero são obrigatórios' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT id, quantidade_estoque FROM produtos WHERE id = ? FOR UPDATE',
      [produtoId]
    );
    if (!rows.length) {
      await connection.rollback();
      return NextResponse.json({ mensagem: 'Produto não encontrado' }, { status: 404 });
    }
    if (rows[0].quantidade_estoque < quantidadeSaida) {
      await connection.rollback();
      return NextResponse.json(
        { mensagem: 'Estoque insuficiente', quantidade_disponivel: rows[0].quantidade_estoque },
        { status: 409 }
      );
    }

    await connection.query(
      'UPDATE produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?',
      [quantidadeSaida, produtoId]
    );
    const [result] = await connection.query(
      `INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao)
       VALUES (?, 'saida', ?, ?)`,
      [produtoId, quantidadeSaida, observacao?.trim() || null]
    );
    await connection.commit();
    return NextResponse.json(
      { id: result.insertId, produto_id: produtoId, quantidade: quantidadeSaida,
        quantidade_estoque: rows[0].quantidade_estoque - quantidadeSaida },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao registrar saída de estoque:', error);
    return NextResponse.json({ mensagem: 'Erro ao registrar saída de estoque' }, { status: 500 });
  } finally {
    connection.release();
  }
}
