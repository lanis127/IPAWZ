-- MODELO DE REFERÊNCIA, NÃO EXECUTE SEM COMPARAR COM O SEU DER ATUAL.
-- Ajuste nomes/tipos/relacionamentos conforme as tabelas já existentes do IPAWZ.

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('doador','adotante','voluntariado','multifuncional') NOT NULL DEFAULT 'doador',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pets (
  id_pet BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  status ENUM('disponivel','em_analise','adotado','inativo') NOT NULL DEFAULT 'disponivel',
  PRIMARY KEY (id_pet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitacoes_adocao (
  id_solicitacao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_pet BIGINT UNSIGNED NOT NULL,
  mensagem TEXT NULL,
  status ENUM('pendente','em_analise','aprovada','recusada','cancelada') NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_solicitacao),
  KEY idx_adocao_usuario (id_usuario),
  KEY idx_adocao_pet (id_pet),
  CONSTRAINT fk_adocao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_adocao_pet FOREIGN KEY (id_pet) REFERENCES pets(id_pet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidaturas_voluntariado (
  id_candidatura BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NOT NULL,
  mensagem TEXT NULL,
  disponibilidade VARCHAR(500) NULL,
  status ENUM('pendente','em_analise','aprovada','recusada') NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_candidatura),
  KEY idx_voluntariado_usuario (id_usuario),
  CONSTRAINT fk_voluntariado_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
