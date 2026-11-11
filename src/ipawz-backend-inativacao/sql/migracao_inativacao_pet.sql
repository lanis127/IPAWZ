-- Execute uma única vez, após backup e conferência do esquema.
-- Pressupõe que pet já tenha status e id_usuario.
ALTER TABLE pet
  ADD COLUMN data_inativacao DATETIME NULL,
  ADD COLUMN motivo_inativacao VARCHAR(255) NULL;

CREATE INDEX idx_pet_status ON pet(status);
