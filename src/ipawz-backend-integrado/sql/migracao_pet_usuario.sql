-- Execute este script uma única vez no banco ipawz.
-- Faça backup antes de alterar tabelas existentes.
USE ipawz;

-- Permite que o pet pertença ao usuário que o cadastrou, sem exigir instituição.
-- id_usuario fica NULL para registros antigos até que sejam revisados; a API sempre preenche esse campo.
ALTER TABLE pet
  ADD COLUMN id_usuario INT NULL AFTER id_pet,
  MODIFY COLUMN id_instituicao INT NULL,
  ADD COLUMN vacinado VARCHAR(3) NULL,
  ADD COLUMN castrado VARCHAR(3) NULL,
  ADD COLUMN doenca TEXT NULL,
  ADD COLUMN temperamento VARCHAR(255) NULL,
  ADD COLUMN sociavel_com_pets VARCHAR(100) NULL,
  ADD COLUMN sociavel_com_pessoas VARCHAR(100) NULL;

-- Para pets antigos vinculados a uma instituição, associa o cadastro ao responsável da instituição.
UPDATE pet p
JOIN instituicao i ON i.id_instituicao = p.id_instituicao
SET p.id_usuario = i.id_responsavel
WHERE p.id_usuario IS NULL;

-- Índice e chave estrangeira para novos registros de usuário.
CREATE INDEX idx_pet_id_usuario ON pet (id_usuario);
ALTER TABLE pet
  ADD CONSTRAINT fk_pet_usuario
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Verifique registros antigos ainda sem responsável antes de decidir torná-lo NOT NULL:
SELECT id_pet, nome, id_instituicao
FROM pet
WHERE id_usuario IS NULL;

-- Depois de resolver manualmente todos os registros listados acima, se quiser exigir o usuário também no banco:
-- ALTER TABLE pet MODIFY COLUMN id_usuario INT NOT NULL;
