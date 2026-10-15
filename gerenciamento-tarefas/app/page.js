'use client';

export { default } from './InventoryPage';

import { useState, useEffect } from 'react';

 const API_BASE_URL = '/api';

export function LegacyHome() {
  const [abaAtiva, setAbaAtiva] = useState('usuarios'); // 'usuarios', 'tarefas', 'gerenciar'

  // Estados de Usuários
  const [usuarios, setUsuarios] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [mensagemUsuario, setMensagemUsuario] = useState({ tipo: '', texto: '' });

  // Estados de Tarefas
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [tarefaEditandoId, setTarefaEditandoId] = useState(null);
  const [mensagemTarefa, setMensagemTarefa] = useState({ tipo: '', texto: '' });

  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    carregarUsuarios();
    carregarTarefas();
  }, []);

  async function carregarUsuarios() {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`);
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }

  async function carregarTarefas() {
    try {
      const res = await fetch(`${API_BASE_URL}/tarefas`);
      const data = await res.json();
      setTarefas(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  }

  function mostrarMensagem(setMensagem, tipo, texto) {
    setMensagem({ tipo, texto });
    setTimeout(() => {
      setMensagem({ tipo: '', texto: '' });
    }, 3000);
  }

  // Cadastro/Edição de Usuário
  async function handleUsuarioSubmit(e) {
    e.preventDefault();
    const method = usuarioEditandoId ? 'PUT' : 'POST';
    const url = usuarioEditandoId ? `${API_BASE_URL}/usuarios/${usuarioEditandoId}` : `${API_BASE_URL}/usuarios`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();

      if (res.ok) {
        mostrarMensagem(setMensagemUsuario, 'success', usuarioEditandoId ? 'Usuário atualizado!' : 'Usuário cadastrado!');
        setNome('');
        setEmail('');
        setSenha('');
        setUsuarioEditandoId(null);
        carregarUsuarios();
      } else {
        mostrarMensagem(setMensagemUsuario, 'error', data.mensagem || 'Erro ao salvar usuário.');
      }
    } catch (error) {
      mostrarMensagem(setMensagemUsuario, 'error', 'Erro de conexão.');
    }
  }

  async function excluirUsuario(id) {
    if (!confirm('Deseja excluir este usuário?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarMensagem(setMensagemUsuario, 'success', 'Usuário excluído!');
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  }

  function prepararEdicaoUsuario(user) {
    setNome(user.nome);
    setEmail(user.email);
    setSenha('');
    setUsuarioEditandoId(user.id);
  }

  // Cadastro/Edição de Tarefa
  async function handleTarefaSubmit(e) {
    e.preventDefault();
    const method = tarefaEditandoId ? 'PUT' : 'POST';
    const url = tarefaEditandoId ? `${API_BASE_URL}/tarefas/${tarefaEditandoId}` : `${API_BASE_URL}/tarefas`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao, usuario_id: responsavel, status }),
      });
      const data = await res.json();

      if (res.ok) {
        mostrarMensagem(setMensagemTarefa, 'success', tarefaEditandoId ? 'Tarefa atualizada!' : 'Tarefa cadastrada!');
        setTitulo('');
        setDescricao('');
        setResponsavel('');
        setStatus('Pendente');
        setTarefaEditandoId(null);
        carregarTarefas();
      } else {
        mostrarMensagem(setMensagemTarefa, 'error', data.mensagem || 'Erro ao salvar tarefa.');
      }
    } catch (error) {
      mostrarMensagem(setMensagemTarefa, 'error', 'Erro de conexão.');
    }
  }

  async function excluirTarefa(id) {
    if (!confirm('Deseja excluir esta tarefa?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tarefas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarTarefas();
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const res = await fetch(`${API_BASE_URL}/tarefas/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) {
        carregarTarefas();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  }

  function prepararEdicaoTarefa(tarefa) {
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao);
    setResponsavel(tarefa.usuario_id);
    setStatus(tarefa.status);
    setTarefaEditandoId(tarefa.id);
    setAbaAtiva('tarefas');
  }

  // Filtragem de Tarefas
  const tarefasFiltradas = tarefas.filter((t) => {
    const matchUser = filtroUsuario ? String(t.usuario_id) === String(filtroUsuario) : true;
    const matchStatus = filtroStatus ? t.status === filtroStatus : true;
    return matchUser && matchStatus;
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>Gerenciamento de Tarefas (Next.js)</h1>
        <nav style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button onClick={() => setAbaAtiva('usuarios')} style={{ fontWeight: abaAtiva === 'usuarios' ? 'bold' : 'normal' }}>
            Cadastro de Usuários
          </button>
          <button onClick={() => setAbaAtiva('tarefas')} style={{ fontWeight: abaAtiva === 'tarefas' ? 'bold' : 'normal' }}>
            Cadastro de Tarefas
          </button>
          <button onClick={() => setAbaAtiva('gerenciar')} style={{ fontWeight: abaAtiva === 'gerenciar' ? 'bold' : 'normal' }}>
            Gerenciar Tarefas
          </button>
        </nav>
      </header>

      <main>
        {/* SEÇÃO USUÁRIOS */}
        {abaAtiva === 'usuarios' && (
          <section>
            <h2>Cadastro de Usuários</h2>
            {mensagemUsuario.texto && (
              <div style={{ padding: '10px', background: mensagemUsuario.tipo === 'success' ? '#d4edda' : '#f8d7da', marginBottom: '10px' }}>
                {mensagemUsuario.texto}
              </div>
            )}
            <form onSubmit={handleUsuarioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label>Nome: </label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div>
                <label>Email: </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label>Senha: </label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
              </div>
              <button type="submit" style={{ width: '120px' }}>{usuarioEditandoId ? 'Atualizar' : 'Cadastrar'}</button>
            </form>

            <h3>Usuários Cadastrados</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>
                      <button onClick={() => prepararEdicaoUsuario(u)}>Editar</button>
                      <button onClick={() => excluirUsuario(u.id)} style={{ marginLeft: '5px', color: 'red' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* SEÇÃO TAREFAS */}
        {abaAtiva === 'tarefas' && (
          <section>
            <h2>Cadastro de Tarefas</h2>
            {mensagemTarefa.texto && (
              <div style={{ padding: '10px', background: mensagemTarefa.tipo === 'success' ? '#d4edda' : '#f8d7da', marginBottom: '10px' }}>
                {mensagemTarefa.texto}
              </div>
            )}
            <form onSubmit={handleTarefaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label>Título: </label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>
              <div>
                <label>Descrição: </label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows="3" />
              </div>
              <div>
                <label>Responsável: </label>
                <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} required>
                  <option value="">Selecione um usuário</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Status: </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>
              <button type="submit" style={{ width: '120px' }}>{tarefaEditandoId ? 'Atualizar' : 'Cadastrar'}</button>
            </form>

            <h3>Tarefas Cadastradas</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.titulo}</td>
                    <td>{t.usuario_nome}</td>
                    <td>{t.status}</td>
                    <td>
                      <button onClick={() => prepararEdicaoTarefa(t)}>Editar</button>
                      <button onClick={() => excluirTarefa(t.id)} style={{ marginLeft: '5px', color: 'red' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* SEÇÃO GERENCIAR */}
        {abaAtiva === 'gerenciar' && (
          <section>
            <h2>Gerenciar Tarefas</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label>Filtrar por usuário: </label>
                <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
                  <option value="">Todos</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Filtrar por status: </label>
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>
            </div>

            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tarefasFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.titulo}</td>
                    <td>{t.descricao}</td>
                    <td>{t.usuario_nome}</td>
                    <td>
                      <select value={t.status} onChange={(e) => atualizarStatus(t.id, e.target.value)}>
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => excluirTarefa(t.id)} style={{ color: 'red' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
