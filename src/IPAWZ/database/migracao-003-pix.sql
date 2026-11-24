-- =========================================================
-- IPAWZ - MIGRAÇÃO 003 (PIX)
-- Cada instituição cadastra a própria chave Pix.
-- A doação financeira passa a ser feita só por Pix: o site gera
-- um QR Code com o valor escolhido e o dinheiro vai direto
-- para a conta da instituição (a IPAWZ não toca no dinheiro).
--
-- Rode este arquivo UMA vez no SQL Editor do Supabase,
-- depois da migracao-002.sql. Pode rodar de novo sem problema.
-- (Quem vai criar o banco do zero usa só o schema.sql.)
-- =========================================================

alter table public.perfis add column if not exists pix_tipo_chave text;
alter table public.perfis add column if not exists pix_chave      text;

alter table public.perfis drop constraint if exists perfis_pix_tipo_chave_check;
alter table public.perfis add constraint perfis_pix_tipo_chave_check
    check (pix_tipo_chave is null or pix_tipo_chave in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria'));

-- tipo e chave andam juntos: ou os dois preenchidos, ou os dois vazios
alter table public.perfis drop constraint if exists perfis_pix_completo_check;
alter table public.perfis add constraint perfis_pix_completo_check
    check ((pix_tipo_chave is null) = (pix_chave is null));
