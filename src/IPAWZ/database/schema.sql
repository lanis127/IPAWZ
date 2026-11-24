-- =========================================================
-- IPAWZ - BANCO DE DADOS (Supabase / PostgreSQL)
-- Como usar: no painel do Supabase, abra "SQL Editor",
-- cole este arquivo inteiro e clique em "Run".
-- Pode rodar de novo sem problema: ele só cria o que falta.
--
-- Os usuários (e-mail e senha) ficam na tabela auth.users,
-- que o próprio Supabase gerencia. A tabela "perfis" guarda
-- os dados extras de cada conta (pessoa física ou jurídica).
-- Já inclui as migrações 002 e 003 (Pix).
-- =========================================================

-- ---------- PERFIS (PF e PJ) ----------
create table if not exists public.perfis (
    id               uuid primary key references auth.users (id) on delete cascade,
    tipo             text not null check (tipo in ('pf', 'pj')),
    email            text not null unique,
    nome             text not null,          -- PF: nome completo | PJ: nome fantasia
    telefone         text,
    foto_url         text,
    descricao        text,

    -- só pessoa física
    data_nascimento  date,
    cpf              text unique,
    tipo_usuario     text check (tipo_usuario in ('simples', 'adotante', 'voluntario', 'multifuncional')),
    experiencia_animais   boolean,
    experiencia_descricao text,
    selfie_documento_path text,              -- caminho no bucket privado "documentos"

    -- só pessoa jurídica (instituição)
    razao_social     text,
    cnpj             text unique,
    tipo_instituicao text,
    representante_nome           text,
    representante_cpf            text,
    cartao_cnpj_path             text,
    documento_representante_path text,
    selfie_representante_path    text,
    comprovante_endereco_path    text,

    -- chave Pix da instituição (doação financeira vai direto para ela)
    pix_tipo_chave   text check (pix_tipo_chave is null or pix_tipo_chave in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
    pix_chave        text,
    constraint perfis_pix_completo_check check ((pix_tipo_chave is null) = (pix_chave is null)),

    -- validação dos documentos (PF adotante/voluntário e instituições)
    status_validacao      text not null default 'pendente'
                          constraint perfis_status_validacao_check
                          check (status_validacao in ('pendente', 'aprovado', 'rejeitado')),
    validacao_enviada_em  timestamptz,       -- vazio = ainda não enviou os documentos
    validacao_observacao  text,              -- motivo, se rejeitado

    -- endereço (os dois tipos)
    rua              text,
    numero           text,
    bairro           text,
    complemento      text,
    cidade           text,
    estado           char(2),
    cep              text,

    criado_em        timestamptz not null default now(),
    atualizado_em    timestamptz not null default now()
);

-- ---------- PETS ----------
create table if not exists public.pets (
    id                  bigint generated always as identity primary key,
    dono_id             uuid not null references public.perfis (id) on delete cascade,
    nome                text not null,
    especie             text not null check (especie in ('cachorro', 'gato', 'passaro', 'outro')),
    sexo                text not null check (sexo in ('macho', 'femea')),
    idade               text not null,                       -- ex.: "2 anos", "3 meses"
    faixa_etaria        text not null check (faixa_etaria in ('filhote', 'jovem', 'adulto', 'idoso')),
    porte               text not null check (porte in ('pequeno', 'medio', 'grande')),
    temperamento        text check (temperamento in ('calmo', 'brincalhao', 'agitado', 'sociavel', 'independente')),
    vacinado            boolean,
    castrado            boolean,
    sociavel_pets       boolean,
    sociavel_pessoas    boolean,
    doenca              text,
    descricao           text,
    cidade              text,
    uf                  char(2),
    foto_url            text,
    status              text not null default 'disponivel' check (status in ('disponivel', 'inativo', 'adotado')),
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);

create index if not exists pets_status_idx on public.pets (status);
create index if not exists pets_dono_idx on public.pets (dono_id);

-- ---------- SOLICITAÇÕES DE ADOÇÃO ----------
create table if not exists public.solicitacoes_adocao (
    id             bigint generated always as identity primary key,
    pet_id         bigint not null references public.pets (id) on delete cascade,
    adotante_id    uuid not null references public.perfis (id) on delete cascade,
    respostas      jsonb not null default '{}'::jsonb,       -- respostas do formulário de adoção
    status         text not null default 'enviada'
                   check (status in ('enviada', 'recebida', 'analise', 'aprovada', 'recusada')),
    observacao     text,                                     -- recado da instituição para o adotante
    criado_em      timestamptz not null default now(),
    atualizado_em  timestamptz not null default now(),
    unique (pet_id, adotante_id)
);

-- ---------- VAGAS DE VOLUNTARIADO ----------
create table if not exists public.vagas (
    id              bigint generated always as identity primary key,
    instituicao_id  uuid not null references public.perfis (id) on delete cascade,
    tipo_servico    text not null,
    tipo_outro      text,                                    -- quando tipo_servico = 'outro'
    local           text not null,
    data            date not null,
    descricao       text not null,
    imagem_url      text,
    ativa           boolean not null default true,
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);

-- ---------- CANDIDATURAS ----------
create table if not exists public.candidaturas (
    id             bigint generated always as identity primary key,
    vaga_id        bigint not null references public.vagas (id) on delete cascade,
    voluntario_id  uuid not null references public.perfis (id) on delete cascade,
    mensagem       text,
    status         text not null default 'enviada'
                   check (status in ('enviada', 'analise', 'aceita', 'negada')),
    criado_em      timestamptz not null default now(),
    atualizado_em  timestamptz not null default now(),
    unique (vaga_id, voluntario_id)
);

-- ---------- DOAÇÕES ----------
create table if not exists public.doacoes (
    id              bigint generated always as identity primary key,
    doador_id       uuid references public.perfis (id) on delete set null,  -- vazio se doou sem login
    instituicao_id  uuid references public.perfis (id) on delete set null,
    tipo            text not null check (tipo in ('financeira', 'alimentos', 'medicamentos', 'acessorios', 'higiene')),
    nome            text not null,
    email           text not null,
    telefone        text,
    detalhes        jsonb not null default '{}'::jsonb,      -- campos que mudam conforme o tipo
    valor           numeric(10, 2),                          -- só doação financeira
    observacoes     text,
    status          text not null default 'registrada' check (status in ('registrada', 'confirmada', 'entregue')),
    criado_em       timestamptz not null default now()
);

-- ---------- CÓDIGOS DE REDEFINIÇÃO DE SENHA ----------
-- Gerados e enviados por e-mail pelo backend. Guardamos só o hash.
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

-- ---------- "atualizado_em" automático ----------
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$;

do $$
declare t text;
begin
    foreach t in array array['perfis', 'pets', 'solicitacoes_adocao', 'vagas', 'candidaturas'] loop
        execute format('drop trigger if exists %I_atualizado on public.%I', t, t);
        execute format('create trigger %I_atualizado before update on public.%I
                        for each row execute function public.tocar_atualizado_em()', t, t);
    end loop;
end $$;

-- ---------- SEGURANÇA (Row Level Security) ----------
-- O site nunca fala direto com o banco: ele fala com o backend (Express),
-- que usa a chave "service_role" e faz as checagens de permissão.
-- Ligando o RLS sem criar políticas, ninguém consegue ler/escrever
-- as tabelas usando a chave pública (anon). Só o backend.
alter table public.perfis              enable row level security;
alter table public.pets                enable row level security;
alter table public.solicitacoes_adocao enable row level security;
alter table public.vagas               enable row level security;
alter table public.candidaturas        enable row level security;
alter table public.doacoes             enable row level security;
alter table public.codigos_senha       enable row level security;

-- ---------- ARMAZENAMENTO DE ARQUIVOS ----------
-- "imagens": público (fotos de pets, perfis e vagas)
insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do nothing;

-- "documentos": PRIVADO (selfies e documentos de validação). Só o backend lê.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 8388608)
on conflict (id) do update set public = false;
