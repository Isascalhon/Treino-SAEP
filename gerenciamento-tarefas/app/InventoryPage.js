'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './InventoryPage.module.css';

const API = '/api';
const emptyProduct = { nome: '', descricao: '', preco: '', quantidade_estoque: '0', categoria_id: '' };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.mensagem || 'Não foi possível concluir a operação.');
  return body;
}

function buscarDados() {
  return Promise.all([
    fetch(`${API}/produtos`).then(readResponse),
    fetch(`${API}/categorias`).then(readResponse),
    fetch(`${API}/estoque`).then(readResponse),
    fetch(`${API}/estoque/saida`).then(readResponse),
  ]);
}

export default function InventoryPage() {
  const [view, setView] = useState('produtos');
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [produtoForm, setProdutoForm] = useState(emptyProduct);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [categoriaNome, setCategoriaNome] = useState('');
  const [categoriaDescricao, setCategoriaDescricao] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [saidaForm, setSaidaForm] = useState({ produto_id: '', quantidade: '1', observacao: '' });
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [p, c, e, s] = await buscarDados();
      setProdutos(p);
      setCategorias(c);
      setEstoque(e);
      setSaidas(s);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    buscarDados()
      .then(([p, c, e, s]) => {
        if (!ativo) return;
        setProdutos(p);
        setCategorias(c);
        setEstoque(e);
        setSaidas(s);
      })
      .catch((error) => {
        if (ativo) setMensagem({ tipo: 'erro', texto: error.message });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  const mostrarMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    window.setTimeout(() => setMensagem(null), 4000);
  };

  const produtosFiltrados = useMemo(() => produtos.filter((produto) => {
    const combinaNome = `${produto.nome} ${produto.categoria_nome || ''}`
      .toLocaleLowerCase('pt-BR').includes(filtro.toLocaleLowerCase('pt-BR'));
    const combinaCategoria = !categoriaFiltro || String(produto.categoria_id) === categoriaFiltro;
    return combinaNome && combinaCategoria;
  }), [produtos, filtro, categoriaFiltro]);

  const unidadesEmEstoque = estoque.reduce((total, item) => total + Number(item.quantidade_estoque), 0);
  const baixoEstoque = estoque.filter((item) => Number(item.quantidade_estoque) <= 5).length;

  async function salvarProduto(event) {
    event.preventDefault();
    const method = produtoEditando ? 'PUT' : 'POST';
    const url = produtoEditando ? `${API}/produtos/${produtoEditando}` : `${API}/produtos`;
    try {
      await readResponse(await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...produtoForm,
          preco: Number(produtoForm.preco),
          quantidade_estoque: Number(produtoForm.quantidade_estoque),
          categoria_id: produtoForm.categoria_id || null,
        }),
      }));
      setProdutoForm(emptyProduct);
      setProdutoEditando(null);
      await carregarDados();
      mostrarMensagem('sucesso', produtoEditando ? 'Produto atualizado.' : 'Produto cadastrado.');
    } catch (error) {
      mostrarMensagem('erro', error.message);
    }
  }

  function editarProduto(produto) {
    setProdutoEditando(produto.id);
    setProdutoForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: String(produto.preco),
      quantidade_estoque: String(produto.quantidade_estoque),
      categoria_id: produto.categoria_id ? String(produto.categoria_id) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluirProduto(id) {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await readResponse(await fetch(`${API}/produtos/${id}`, { method: 'DELETE' }));
      await carregarDados();
      mostrarMensagem('sucesso', 'Produto excluído.');
    } catch (error) {
      mostrarMensagem('erro', error.message);
    }
  }

  async function salvarCategoria(event) {
    event.preventDefault();
    const method = categoriaEditando ? 'PUT' : 'POST';
    const url = categoriaEditando ? `${API}/categorias/${categoriaEditando}` : `${API}/categorias`;
    try {
      await readResponse(await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: categoriaNome, descricao: categoriaDescricao }),
      }));
      setCategoriaNome('');
      setCategoriaDescricao('');
      setCategoriaEditando(null);
      await carregarDados();
      mostrarMensagem('sucesso', method === 'POST' ? 'Categoria cadastrada.' : 'Categoria atualizada.');
    } catch (error) {
      mostrarMensagem('erro', error.message);
    }
  }

  async function excluirCategoria(id) {
    if (!window.confirm('Excluir esta categoria? Os produtos vinculados permanecem cadastrados.')) return;
    try {
      await readResponse(await fetch(`${API}/categorias/${id}`, { method: 'DELETE' }));
      await carregarDados();
      mostrarMensagem('sucesso', 'Categoria excluída.');
    } catch (error) {
      mostrarMensagem('erro', error.message);
    }
  }

  async function registrarSaida(event) {
    event.preventDefault();
    try {
      await readResponse(await fetch(`${API}/estoque/saida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...saidaForm, quantidade: Number(saidaForm.quantidade) }),
      }));
      setSaidaForm({ produto_id: '', quantidade: '1', observacao: '' });
      await carregarDados();
      mostrarMensagem('sucesso', 'Saída registrada e saldo atualizado.');
    } catch (error) {
      mostrarMensagem('erro', error.message);
    }
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Estoque, início">
          <span className={styles.brandMark}>E</span>
          <span>Estoque<span className={styles.brandAccent}>+</span></span>
        </Link>
        <nav className={styles.navigation} aria-label="Navegação principal">
          {[
            ['produtos', 'Produtos'],
            ['categorias', 'Categorias'],
            ['estoque', 'Estoque'],
          ].map(([id, label]) => (
            <button key={id} className={view === id ? styles.navActive : ''} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </nav>
        <span className={styles.systemLabel}><span /> Sistema de estoque</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageHeading}>
          <div>
            <p className={styles.eyebrow}>CONTROLE DE INVENTÁRIO</p>
            <h1>{view === 'produtos' ? 'Cadastro de produtos' : view === 'categorias' ? 'Categorias' : 'Estoque'}</h1>
            <p className={styles.subtitle}>
              {view === 'produtos' && 'Cadastre, consulte e atualize os produtos do seu inventário.'}
              {view === 'categorias' && 'Organize os produtos por categoria.'}
              {view === 'estoque' && 'Acompanhe saldos disponíveis e registre saídas.'}
            </p>
          </div>
          <button className={styles.refreshButton} onClick={carregarDados} title="Atualizar dados" aria-label="Atualizar dados">↻</button>
        </div>

        {mensagem && <div className={`${styles.alert} ${mensagem.tipo === 'erro' ? styles.alertError : styles.alertSuccess}`} role="status">{mensagem.texto}</div>}

        <section className={styles.metrics} aria-label="Resumo do estoque">
          <div className={styles.metric}><span>Produtos cadastrados</span><strong>{produtos.length}</strong></div>
          <div className={styles.metric}><span>Unidades em estoque</span><strong>{unidadesEmEstoque}</strong></div>
          <div className={styles.metric}><span>Itens com estoque baixo</span><strong className={baixoEstoque ? styles.warningValue : ''}>{baixoEstoque}</strong></div>
        </section>

        {view === 'produtos' && (
          <>
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div><h2>{produtoEditando ? 'Editar produto' : 'Novo produto'}</h2><p>Os campos marcados com * são obrigatórios.</p></div>
                {produtoEditando && <button className={styles.textButton} onClick={() => { setProdutoEditando(null); setProdutoForm(emptyProduct); }}>Cancelar edição</button>}
              </div>
              <form className={styles.formGrid} onSubmit={salvarProduto}>
                <label className={styles.field}>Nome do produto *<input required maxLength="150" value={produtoForm.nome} onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })} placeholder="Ex.: Caderno universitário" /></label>
                <label className={styles.field}>Categoria<select value={produtoForm.categoria_id} onChange={(e) => setProdutoForm({ ...produtoForm, categoria_id: e.target.value })}><option value="">Sem categoria</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label>
                <label className={styles.field}>Preço (R$) *<input required type="number" min="0" step="0.01" value={produtoForm.preco} onChange={(e) => setProdutoForm({ ...produtoForm, preco: e.target.value })} placeholder="0,00" /></label>
                <label className={styles.field}>Quantidade inicial *<input required type="number" min="0" step="1" value={produtoForm.quantidade_estoque} onChange={(e) => setProdutoForm({ ...produtoForm, quantidade_estoque: e.target.value })} /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}>Descrição<textarea rows="2" maxLength="1000" value={produtoForm.descricao} onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })} placeholder="Detalhes opcionais do produto" /></label>
                <div className={`${styles.formActions} ${styles.fieldWide}`}><button className={styles.primaryButton} type="submit">{produtoEditando ? 'Salvar alterações' : 'Cadastrar produto'}</button></div>
              </form>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><h2>Produtos cadastrados</h2><p>{produtosFiltrados.length} de {produtos.length} produtos</p></div></div>
              <div className={styles.filters}>
                <label className={styles.searchField}><span>Buscar</span><input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nome ou categoria" /></label>
                <label className={styles.filterField}><span>Categoria</span><select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}><option value="">Todas</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label>
              </div>
              <div className={styles.tableWrap}><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Quantidade</th><th className={styles.actionsHeader}>Ações</th></tr></thead><tbody>
                {produtosFiltrados.map((produto) => <tr key={produto.id}><td><strong>{produto.nome}</strong>{produto.descricao && <small>{produto.descricao}</small>}</td><td>{produto.categoria_nome || '—'}</td><td>{money.format(Number(produto.preco))}</td><td><span className={`${styles.stockPill} ${Number(produto.quantidade_estoque) <= 5 ? styles.stockLow : ''}`}>{produto.quantidade_estoque} un.</span></td><td className={styles.rowActions}><button onClick={() => editarProduto(produto)}>Editar</button><button className={styles.dangerText} onClick={() => excluirProduto(produto.id)}>Excluir</button></td></tr>)}
                {!carregando && !produtosFiltrados.length && <tr><td colSpan="5" className={styles.emptyState}>{produtos.length ? 'Nenhum produto corresponde à busca.' : 'Nenhum produto cadastrado. Use o formulário acima para começar.'}</td></tr>}
                {carregando && <tr><td colSpan="5" className={styles.emptyState}>Carregando produtos…</td></tr>}
              </tbody></table></div>
            </section>
          </>
        )}

        {view === 'categorias' && (
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><h2>{categoriaEditando ? 'Editar categoria' : 'Nova categoria'}</h2><p>Use categorias para organizar e filtrar os produtos.</p></div></div>
            <form className={styles.categoryForm} onSubmit={salvarCategoria}>
              <label className={styles.field}>Nome *<input required maxLength="100" value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} placeholder="Ex.: Papelaria" /></label>
              <label className={styles.field}>Descrição<input maxLength="255" value={categoriaDescricao} onChange={(e) => setCategoriaDescricao(e.target.value)} placeholder="Descrição opcional" /></label>
              <div className={styles.categoryActions}><button className={styles.primaryButton} type="submit">{categoriaEditando ? 'Salvar categoria' : 'Cadastrar categoria'}</button>{categoriaEditando && <button type="button" className={styles.textButton} onClick={() => { setCategoriaEditando(null); setCategoriaNome(''); setCategoriaDescricao(''); }}>Cancelar</button>}</div>
            </form>
            <div className={styles.tableWrap}><table><thead><tr><th>Categoria</th><th>Descrição</th><th>Produtos</th><th className={styles.actionsHeader}>Ações</th></tr></thead><tbody>
              {categorias.map((categoria) => <tr key={categoria.id}><td><strong>{categoria.nome}</strong></td><td>{categoria.descricao || '—'}</td><td>{produtos.filter((produto) => produto.categoria_id === categoria.id).length}</td><td className={styles.rowActions}><button onClick={() => { setCategoriaEditando(categoria.id); setCategoriaNome(categoria.nome); setCategoriaDescricao(categoria.descricao || ''); }}>Editar</button><button className={styles.dangerText} onClick={() => excluirCategoria(categoria.id)}>Excluir</button></td></tr>)}
              {!carregando && !categorias.length && <tr><td colSpan="4" className={styles.emptyState}>Nenhuma categoria cadastrada.</td></tr>}
            </tbody></table></div>
          </section>
        )}

        {view === 'estoque' && (
          <>
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><h2>Registrar saída</h2><p>A quantidade será descontada do saldo imediatamente.</p></div></div>
              <form className={styles.formGrid} onSubmit={registrarSaida}>
                <label className={styles.field}>Produto *<select required value={saidaForm.produto_id} onChange={(e) => setSaidaForm({ ...saidaForm, produto_id: e.target.value })}><option value="">Selecione um produto</option>{produtos.map((produto) => <option key={produto.id} value={produto.id}>{produto.nome} · {produto.quantidade_estoque} un.</option>)}</select></label>
                <label className={styles.field}>Quantidade *<input required type="number" min="1" step="1" value={saidaForm.quantidade} onChange={(e) => setSaidaForm({ ...saidaForm, quantidade: e.target.value })} /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}>Observação<input maxLength="255" value={saidaForm.observacao} onChange={(e) => setSaidaForm({ ...saidaForm, observacao: e.target.value })} placeholder="Motivo ou referência da saída" /></label>
                <div className={`${styles.formActions} ${styles.fieldWide}`}><button className={styles.primaryButton} type="submit" disabled={!produtos.length}>Registrar saída</button></div>
              </form>
            </section>
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><h2>Saldo atual</h2><p>Produtos com até 5 unidades aparecem sinalizados.</p></div></div>
              <div className={styles.tableWrap}><table><thead><tr><th>Produto</th><th>Categoria</th><th>Disponível</th></tr></thead><tbody>
                {estoque.map((item) => <tr key={item.produto_id}><td><strong>{item.produto}</strong></td><td>{item.categoria || '—'}</td><td><span className={`${styles.stockPill} ${Number(item.quantidade_estoque) <= 5 ? styles.stockLow : ''}`}>{item.quantidade_estoque} un.</span></td></tr>)}
                {!carregando && !estoque.length && <tr><td colSpan="3" className={styles.emptyState}>Nenhum produto no estoque.</td></tr>}
              </tbody></table></div>
            </section>
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><h2>Últimas saídas</h2><p>Histórico de movimentações registradas.</p></div></div>
              <div className={styles.tableWrap}><table><thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Observação</th></tr></thead><tbody>
                {saidas.slice(0, 10).map((saida) => <tr key={saida.id}><td>{saida.criado_em ? new Date(saida.criado_em).toLocaleString('pt-BR') : '—'}</td><td>{saida.produto}</td><td>{saida.quantidade} un.</td><td>{saida.observacao || '—'}</td></tr>)}
                {!carregando && !saidas.length && <tr><td colSpan="4" className={styles.emptyState}>Nenhuma saída registrada.</td></tr>}
              </tbody></table></div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
