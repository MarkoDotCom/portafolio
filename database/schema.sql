-- =============================================================================
-- Marketplace laboral (tipo LinkedIn) — esquema PostgreSQL 13+
-- Actores: trabajador (worker_profile) y empleador (company + company_member)
-- Esquemas: users (cuentas y medios), workers (perfil y portafolio del trabajador),
-- companies (empresas, ofertas y postulaciones) y public (enums, función y catálogo skill)
-- Ejecutar: psql -d <db> -f schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA users;      -- cuentas y medios subidos
CREATE SCHEMA workers;    -- perfil y portafolio del trabajador
CREATE SCHEMA companies;  -- empresas, miembros, ofertas y postulaciones

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
CREATE TYPE company_role       AS ENUM ('owner', 'recruiter');
CREATE TYPE company_size       AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001+');
CREATE TYPE employment_type    AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
CREATE TYPE work_mode          AS ENUM ('onsite', 'hybrid', 'remote');
CREATE TYPE job_status         AS ENUM ('draft', 'published', 'closed');
CREATE TYPE application_status AS ENUM ('applied', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn');
CREATE TYPE social_platform    AS ENUM ('github', 'linkedin', 'website', 'twitter', 'other');
CREATE TYPE skill_category     AS ENUM ('language', 'framework', 'tool', 'database', 'cloud', 'soft_skill', 'other');

-- -----------------------------------------------------------------------------
-- Función compartida para updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. Identidad y actores
-- =============================================================================

CREATE TABLE users.app_user (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            citext NOT NULL UNIQUE,
  external_auth_id text UNIQUE,                 -- id del proveedor de identidad (Clerk, Auth0, ...)
  full_name        text NOT NULL,
  avatar_media_id  uuid,                        -- FK a media_asset, se agrega más abajo (referencia circular)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users.media_asset (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES users.app_user(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,             -- ruta/clave en el storage (S3, GCS, disco)
  url         text NOT NULL,
  mime_type   text NOT NULL,
  size_bytes  bigint NOT NULL CHECK (size_bytes >= 0),
  alt_text    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_asset_owner_idx ON users.media_asset (owner_id);

ALTER TABLE users.app_user
  ADD CONSTRAINT app_user_avatar_fk
  FOREIGN KEY (avatar_media_id) REFERENCES users.media_asset(id) ON DELETE SET NULL;

-- Perfil de trabajador: 1:1 opcional con la cuenta. Tener fila aquí = ser trabajador.
CREATE TABLE workers.worker_profile (
  user_id      uuid PRIMARY KEY REFERENCES users.app_user(id) ON DELETE CASCADE,
  slug         citext NOT NULL UNIQUE,          -- URL pública: /p/<slug>
  headline     text,
  summary      text,
  location     text,
  is_public    boolean NOT NULL DEFAULT false,
  open_to_work boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_profile_open_idx ON workers.worker_profile (open_to_work) WHERE is_public;

CREATE TABLE companies.company (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          citext NOT NULL UNIQUE,         -- URL pública: /c/<slug>
  name          text NOT NULL,
  description   text,
  website_url   text,
  industry      text,
  size          company_size,
  location      text,
  logo_media_id uuid REFERENCES users.media_asset(id) ON DELETE SET NULL,
  created_by    uuid REFERENCES users.app_user(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Ser empleador = ser miembro de una empresa. Un usuario puede administrar varias.
CREATE TABLE companies.company_member (
  company_id uuid NOT NULL REFERENCES companies.company(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users.app_user(id) ON DELETE CASCADE,
  role       company_role NOT NULL DEFAULT 'recruiter',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);
CREATE INDEX company_member_user_idx ON companies.company_member (user_id);

-- =============================================================================
-- 2. Perfil del trabajador (portafolio)
-- =============================================================================

CREATE TABLE workers.social_link (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id  uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  platform   social_platform NOT NULL,
  url        text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX social_link_worker_idx ON workers.social_link (worker_id, sort_order);

CREATE TABLE workers.experience (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  company_id      uuid REFERENCES companies.company(id) ON DELETE SET NULL,  -- si la empresa existe en la plataforma
  company_name    text NOT NULL,                                   -- siempre presente; permite empresas no registradas
  title           text NOT NULL,
  employment_type employment_type,
  work_mode       work_mode,
  location        text,
  start_date      date NOT NULL,
  end_date        date,                                            -- NULL = actualidad
  description     text,
  is_visible      boolean NOT NULL DEFAULT true,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experience_dates_chk CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX experience_worker_idx  ON workers.experience (worker_id, sort_order);
CREATE INDEX experience_company_idx ON workers.experience (company_id) WHERE company_id IS NOT NULL;

CREATE TABLE workers.education (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  institution    text NOT NULL,
  degree         text NOT NULL,
  field_of_study text,
  start_date     date NOT NULL,
  end_date       date,
  description    text,
  is_visible     boolean NOT NULL DEFAULT true,
  sort_order     int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT education_dates_chk CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX education_worker_idx ON workers.education (worker_id, sort_order);

CREATE TABLE workers.certification (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  name           text NOT NULL,
  issuer         text NOT NULL,
  issued_at      date NOT NULL,
  expires_at     date,
  credential_id  text,
  credential_url text,
  is_visible     boolean NOT NULL DEFAULT true,
  sort_order     int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certification_dates_chk CHECK (expires_at IS NULL OR expires_at >= issued_at)
);
CREATE INDEX certification_worker_idx ON workers.certification (worker_id, sort_order);

CREATE TABLE workers.project (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  slug           citext NOT NULL,
  title          text NOT NULL,
  summary        text,
  description    text,
  repo_url       text,
  demo_url       text,
  cover_media_id uuid REFERENCES users.media_asset(id) ON DELETE SET NULL,
  started_at     date,
  ended_at       date,
  is_featured    boolean NOT NULL DEFAULT false,
  is_visible     boolean NOT NULL DEFAULT true,
  sort_order     int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_slug_uq   UNIQUE (worker_id, slug),
  CONSTRAINT project_dates_chk CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX project_worker_idx ON workers.project (worker_id, sort_order);

CREATE TABLE workers.project_media (
  project_id uuid NOT NULL REFERENCES workers.project(id) ON DELETE CASCADE,
  media_id   uuid NOT NULL REFERENCES users.media_asset(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, media_id)
);

-- =============================================================================
-- 3. Skills (catálogo global)
-- =============================================================================

CREATE TABLE public.skill (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       citext NOT NULL UNIQUE,            -- 'Angular' y 'angular' son la misma skill
  category   skill_category NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workers.worker_skill (
  worker_id  uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  skill_id   uuid NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  level      smallint CHECK (level BETWEEN 1 AND 5),
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (worker_id, skill_id)
);
CREATE INDEX worker_skill_skill_idx ON workers.worker_skill (skill_id);  -- buscar candidatos por skill

CREATE TABLE workers.experience_skill (
  experience_id uuid NOT NULL REFERENCES workers.experience(id) ON DELETE CASCADE,
  skill_id      uuid NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  PRIMARY KEY (experience_id, skill_id)
);
CREATE INDEX experience_skill_skill_idx ON workers.experience_skill (skill_id);

CREATE TABLE workers.project_skill (
  project_id uuid NOT NULL REFERENCES workers.project(id) ON DELETE CASCADE,
  skill_id   uuid NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);
CREATE INDEX project_skill_skill_idx ON workers.project_skill (skill_id);

-- =============================================================================
-- 4. Empleo: ofertas y postulaciones
-- =============================================================================

CREATE TABLE companies.job_posting (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies.company(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES users.app_user(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text NOT NULL,
  employment_type employment_type NOT NULL,
  work_mode       work_mode NOT NULL,
  location        text,
  salary_min      numeric(12,2),
  salary_max      numeric(12,2),
  salary_currency char(3),                      -- ISO 4217: CLP, USD, EUR...
  status          job_status NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  closes_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_posting_salary_range_chk    CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
  CONSTRAINT job_posting_salary_currency_chk CHECK ((salary_min IS NULL AND salary_max IS NULL) OR salary_currency IS NOT NULL),
  CONSTRAINT job_posting_published_chk       CHECK (status = 'draft' OR published_at IS NOT NULL)
);
CREATE INDEX job_posting_company_idx   ON companies.job_posting (company_id, status);
CREATE INDEX job_posting_published_idx ON companies.job_posting (published_at DESC) WHERE status = 'published';

CREATE TABLE companies.job_posting_skill (
  job_posting_id uuid NOT NULL REFERENCES companies.job_posting(id) ON DELETE CASCADE,
  skill_id       uuid NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  is_required    boolean NOT NULL DEFAULT true,  -- false = deseable
  PRIMARY KEY (job_posting_id, skill_id)
);
CREATE INDEX job_posting_skill_skill_idx ON companies.job_posting_skill (skill_id);

CREATE TABLE companies.job_application (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES companies.job_posting(id) ON DELETE CASCADE,
  worker_id      uuid NOT NULL REFERENCES workers.worker_profile(user_id) ON DELETE CASCADE,
  status         application_status NOT NULL DEFAULT 'applied',
  cover_letter   text,
  applied_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_application_uq UNIQUE (job_posting_id, worker_id)  -- una postulación por oferta
);
CREATE INDEX job_application_worker_idx  ON companies.job_application (worker_id, applied_at DESC);
CREATE INDEX job_application_posting_idx ON companies.job_application (job_posting_id, status);

-- Historial del pipeline. La aplicación inserta una fila en cada cambio de status.
CREATE TABLE companies.job_application_event (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES companies.job_application(id) ON DELETE CASCADE,
  changed_by     uuid REFERENCES users.app_user(id) ON DELETE SET NULL,  -- reclutador o el propio trabajador (withdrawn)
  from_status    application_status,                               -- NULL en el evento inicial
  to_status      application_status NOT NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_application_event_app_idx ON companies.job_application_event (application_id, created_at);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users.app_user', 'workers.worker_profile', 'workers.experience', 'workers.education',
    'workers.certification', 'workers.project', 'companies.company', 'companies.job_posting',
    'companies.job_application'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      split_part(t, '.', 2) || '_set_updated_at', t
    );
  END LOOP;
END $$;
