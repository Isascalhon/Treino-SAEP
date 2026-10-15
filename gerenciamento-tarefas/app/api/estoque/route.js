import { NextResponse } from 'next/server';
import pool from '@/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT p.id AS produto_id, p.nome AS produto, p.quantidade_estoque,
             c.nome AS categoria
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ORDER BY p.nome
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    return NextResponse.json({ mensagem: 'Erro ao consultar estoque' }, { status: 500 });
  }
}
