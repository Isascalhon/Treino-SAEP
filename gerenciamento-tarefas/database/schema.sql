CREATE TABLE IF NOT EXISTS categorias (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(255) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  quantidade_estoque INT NOT NULL DEFAULT 0,
  categoria_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_produtos_quantidade CHECK (quantidade_estoque >= 0),
  CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  quantidade INT NOT NULL,
  observacao VARCHAR(255) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_movimentacao_quantidade CHECK (quantidade > 0),
  CONSTRAINT fk_movimentacoes_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id) ON DELETE RESTRICT
);
