-- =========================================================
-- IPAWZ - MIGRAÇÃO 002
-- Tipo de usuário (PF), validação de PF e de instituições,
-- código de redefinição de senha e bucket privado de documentos.
--
-- Quem JÁ rodou o schema.sql antigo: rode SÓ este arquivo no SQL Editor.
-- Quem vai criar o banco do zero: rode só o schema.sql (ele já inclui isto).
-- Pode rodar mais de uma vez sem problema.
-- =========================================================

-- ---------- 1. Tipo de usuário (pessoa física) ----------
-- Substitui o antigo "tipo_interesse" pelos 4 perfis do Figma.
alter table public.perfis add column if not exists tipo_usuario text
    check (tipo_usuario in ('simples', 'adotante', 'voluntario', 'multifuncional'));

do $$
begin
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'perfis' and column_name = 'tipo_interesse') then
        update public.perfis set tipo_usuario = case tipo_interesse
            when 'doacao' then 'simples'
            when 'adocao' then 'adotante'
            when 'voluntariado' then 'voluntario'
            when 'todos' then 'multifuncional'
        end
        where tipo = 'pf' and tipo_usuario is null and tipo_interesse is not null;

        alter table public.perfis drop column tipo_interesse;
    end if;
end $$;

-- ---------- 2. Validação (PF e instituições) ----------
-- status_validacao: começa como 'pendente'; a equipe IPAWZ muda para 'aprovado' ou 'rejeitado'.
-- validacao_enviada_em: data em que os documentos foram enviados (vazio = ainda não enviou).
alter table public.perfis add column if not exists status_validacao text not null default 'pendente';
alter table public.perfis drop constraint if exists perfis_status_validacao_check;
alter table public.perfis add constraint perfis_status_validacao_check
    check (status_validacao in ('pendente', 'aprovado', 'rejeitado'));
alter table public.perfis add column if not exists validacao_enviada_em  timestamptz;
alter table public.perfis add column if not exists validacao_observacao  text;   -- motivo, se rejeitado

-- Pessoa física (adotante / voluntário)
alter table public.perfis add column if not exists experiencia_animais   boolean;
alter table public.perfis add column if not exists experiencia_descricao text;
alter table public.perfis add column if not exists selfie_documento_path text;   -- caminho no bucket privado

-- Instituição (representante legal + documentos)
alter table public.perfis add column if not exists representante_nome          text;
alter table public.perfis add column if not exists representante_cpf           text;
alter table public.perfis add column if not exists cartao_cnpj_path            text;
alter table public.perfis add column if not exists documento_representante_path text;
alter table public.perfis add column if not exists selfie_representante_path   text;
alter table public.perfis add column if not exists comprovante_endereco_path   text;

-- ---------- 3. Códigos de redefinição de senha ----------
-- O código de 6 dígitos é gerado e enviado pelo próprio backend (Nodemailer).
-- Guardamos só o HASH do código, nunca o código em si.
create table if not exists public.codigos_senha (
    id           bigint generated always as identity primary key,
    usuario_id   uuid not null references auth.users (id) on delete cascade,
    codigo_hash  text not null,
    expira_em    timestamptz not null,
    tentativas   int not null default 0,
    usado_em     timestamptz,
    criado_em    timestamptz not null default now()
);
create index if not exists codigos_senha_usuario_idx on public.codigos_senha (usuario_id, criado_em desc);
alter table public.codigos_senha enable row level security;

-- ---------- 4. Bucket PRIVADO para documentos ----------
-- Diferente do bucket "imagens", este não tem link público:
-- só o backend (service_role) consegue ler os arquivos.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 8388608)   -- 8 MB por arquivo
on conflict (id) do update set public = false;
