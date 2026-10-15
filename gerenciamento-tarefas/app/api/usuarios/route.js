import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/db';

export async function GET() {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nome, email FROM usuarios ORDER BY id DESC'
    );
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { mensagem: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { nome, email, senha } = await request.json();
    if (!nome?.trim() || !email?.trim() || !senha) {
      return NextResponse.json(
        { mensagem: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const [existentes] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.trim()]
    );
    if (existentes.length) {
      return NextResponse.json(
        { mensagem: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome.trim(), email.trim(), senhaHash]
    );

    return NextResponse.json(
      { id: result.insertId, nome: nome.trim(), email: email.trim() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json(
      { mensagem: 'Erro ao cadastrar usuário' },
      { status: 500 }
    );
  }
}
