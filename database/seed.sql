-- =============================================================================
-- Datos de ejemplo — ejecutar después de schema.sql
--   psql -d <db> -f seed.sql
-- UUIDs fijos para poder consultarlos a mano:
--   1... usuarios | 2... media | 3... empresas | 4... skills | 5... experiencia
--   6... educación | 7... certificaciones | 8... proyectos | 9... ofertas
--   a... postulaciones | b... eventos de postulación
-- =============================================================================
BEGIN;

-- Usuarios -------------------------------------------------------------------
INSERT INTO users.app_user (id, email, external_auth_id, full_name) VALUES
  ('10000000-0000-4000-8000-000000000001', 'ana.rojas@example.com',   'auth|ana',   'Ana Rojas'),
  ('10000000-0000-4000-8000-000000000002', 'bruno.diaz@example.com',  'auth|bruno', 'Bruno Díaz'),
  ('10000000-0000-4000-8000-000000000003', 'carla.munoz@example.com', 'auth|carla', 'Carla Muñoz'),
  ('10000000-0000-4000-8000-000000000004', 'diego.perez@example.com', 'auth|diego', 'Diego Pérez');

-- Media ----------------------------------------------------------------------
INSERT INTO users.media_asset (id, owner_id, storage_key, url, mime_type, size_bytes, alt_text) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'avatars/ana.png',          'https://cdn.example.com/avatars/ana.png',          'image/png', 48211,  'Foto de Ana Rojas'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'logos/nortech.svg',        'https://cdn.example.com/logos/nortech.svg',        'image/svg+xml', 3120, 'Logo Nortech Labs'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'projects/ui-kit-cover.png','https://cdn.example.com/projects/ui-kit-cover.png','image/png', 152034, 'Portada del UI Kit');

UPDATE users.app_user SET avatar_media_id = '20000000-0000-4000-8000-000000000001'
 WHERE id = '10000000-0000-4000-8000-000000000001';

-- Trabajadores ---------------------------------------------------------------
INSERT INTO workers.worker_profile (user_id, slug, headline, summary, location, is_public, open_to_work) VALUES
  ('10000000-0000-4000-8000-000000000001', 'ana-rojas',  'Frontend Engineer · Angular & Design Systems',
   'Seis años construyendo interfaces accesibles y librerías de componentes.', 'Santiago, Chile', true, true),
  ('10000000-0000-4000-8000-000000000002', 'bruno-diaz', 'Backend Developer · Node.js & PostgreSQL',
   'APIs y modelado de datos para productos SaaS.', 'Valparaíso, Chile', true, false);

INSERT INTO workers.social_link (worker_id, platform, url, sort_order) VALUES
  ('10000000-0000-4000-8000-000000000001', 'github',   'https://github.com/anarojas', 0),
  ('10000000-0000-4000-8000-000000000001', 'website',  'https://anarojas.dev',        1),
  ('10000000-0000-4000-8000-000000000002', 'github',   'https://github.com/brunodiaz', 0);

-- Empresa y empleadores ------------------------------------------------------
INSERT INTO companies.company (id, slug, name, description, website_url, industry, size, location, logo_media_id, created_by) VALUES
  ('30000000-0000-4000-8000-000000000001', 'nortech-labs', 'Nortech Labs',
   'Consultora de software especializada en productos web para retail y banca.',
   'https://nortech.example.com', 'Software', '51-200', 'Santiago, Chile',
   '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003');

INSERT INTO companies.company_member (company_id, user_id, role) VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'owner'),
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'recruiter');

-- Skills (catálogo global) ---------------------------------------------------
INSERT INTO public.skill (id, name, category) VALUES
  ('40000000-0000-4000-8000-000000000001', 'TypeScript',   'language'),
  ('40000000-0000-4000-8000-000000000002', 'Angular',      'framework'),
  ('40000000-0000-4000-8000-000000000003', 'React',        'framework'),
  ('40000000-0000-4000-8000-000000000004', 'Node.js',      'framework'),
  ('40000000-0000-4000-8000-000000000005', 'PostgreSQL',   'database'),
  ('40000000-0000-4000-8000-000000000006', 'Docker',       'tool'),
  ('40000000-0000-4000-8000-000000000007', 'SCSS',         'language'),
  ('40000000-0000-4000-8000-000000000008', 'Comunicación', 'soft_skill');

INSERT INTO workers.worker_skill (worker_id, skill_id, level, sort_order) VALUES
  -- Ana
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 5, 0),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 5, 1),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007', 4, 2),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 3, 3),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000008', 4, 4),
  -- Bruno
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', 5, 0),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000005', 4, 1),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 4, 2),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000006', 3, 3);

-- Experiencia ----------------------------------------------------------------
INSERT INTO workers.experience (id, worker_id, company_id, company_name, title, employment_type, work_mode, location, start_date, end_date, description, sort_order) VALUES
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', NULL, 'Agencia Pixel',
   'Senior Frontend Engineer', 'full_time', 'remote', 'Remoto', '2022-03-01', NULL,
   'Lidero el design system y la migración a Angular standalone.', 0),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Nortech Labs',
   'Frontend Developer', 'full_time', 'onsite', 'Santiago, Chile', '2019-06-01', '2022-02-28',
   'Desarrollo de portales de autoatención para banca.', 1),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', NULL, 'DataSur',
   'Backend Developer', 'full_time', 'hybrid', 'Valparaíso, Chile', '2021-01-04', NULL,
   'APIs REST en Node.js sobre PostgreSQL; pipelines de datos.', 0);

INSERT INTO workers.experience_skill (experience_id, skill_id) VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004'),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000005');

-- Educación y certificaciones --------------------------------------------------
INSERT INTO workers.education (id, worker_id, institution, degree, field_of_study, start_date, end_date, sort_order) VALUES
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Universidad de Chile',   'Ingeniería Civil en Computación', 'Computación', '2014-03-01', '2019-01-31', 0),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Universidad Técnica Federico Santa María', 'Ingeniería en Informática', 'Informática', '2016-03-01', '2020-12-15', 0);

INSERT INTO workers.certification (id, worker_id, name, issuer, issued_at, expires_at, credential_url, sort_order) VALUES
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Web Accessibility Specialist (WAS)', 'IAAP', '2023-05-10', '2026-05-10', 'https://iaap.example.com/cred/was-123', 0);

-- Proyectos ------------------------------------------------------------------
INSERT INTO workers.project (id, worker_id, slug, title, summary, repo_url, demo_url, cover_media_id, started_at, is_featured, sort_order) VALUES
  ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'ui-kit',
   'UI Kit accesible', 'Librería de componentes Angular con tema claro/oscuro y tokens de diseño.',
   'https://github.com/anarojas/ui-kit', 'https://ui-kit.anarojas.dev',
   '20000000-0000-4000-8000-000000000003', '2024-02-01', true, 0);

INSERT INTO workers.project_skill (project_id, skill_id) VALUES
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'),
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007');

INSERT INTO workers.project_media (project_id, media_id, sort_order) VALUES
  ('80000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 0);

-- Ofertas --------------------------------------------------------------------
INSERT INTO companies.job_posting (id, company_id, created_by, title, description, employment_type, work_mode, location, salary_min, salary_max, salary_currency, status, published_at, closes_at) VALUES
  ('90000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004',
   'Senior Frontend Engineer (Angular)',
   'Buscamos frontend senior para liderar el design system de nuestros productos de banca digital.',
   'full_time', 'hybrid', 'Santiago, Chile', 3200000, 4200000, 'CLP', 'published', now() - interval '10 days', now() + interval '20 days'),
  ('90000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004',
   'Backend Developer (Node.js)',
   'Desarrollo de servicios REST y modelado de datos en PostgreSQL para plataforma de retail.',
   'full_time', 'remote', NULL, 2800000, 3600000, 'CLP', 'published', now() - interval '5 days', NULL),
  ('90000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003',
   'Práctica profesional QA',
   'Borrador: apoyo al equipo de QA en pruebas automatizadas.',
   'internship', 'onsite', 'Santiago, Chile', NULL, NULL, NULL, 'draft', NULL, NULL);

INSERT INTO companies.job_posting_skill (job_posting_id, skill_id, is_required) VALUES
  ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', true),
  ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', true),
  ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007', false),
  ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', true),
  ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000005', true),
  ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000006', false);

-- Postulaciones y su historial -------------------------------------------------
INSERT INTO companies.job_application (id, job_posting_id, worker_id, status, cover_letter, applied_at) VALUES
  -- Ana → Frontend: avanzó hasta entrevista
  ('a0000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'interview', 'Trabajé en Nortech entre 2019 y 2022; me interesa volver a liderar el design system.', now() - interval '9 days'),
  -- Bruno → Frontend: recién postulado
  ('a0000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002',
   'applied', NULL, now() - interval '1 day'),
  -- Bruno → Backend: se retiró
  ('a0000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   'withdrawn', 'Tengo experiencia directa en el stack que piden.', now() - interval '4 days');

INSERT INTO companies.job_application_event (application_id, changed_by, from_status, to_status, note, created_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', NULL,        'applied',   NULL,                              now() - interval '9 days'),
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'applied',   'reviewing', 'Perfil muy alineado.',            now() - interval '7 days'),
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'reviewing', 'interview', 'Entrevista técnica agendada.',    now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', NULL,        'applied',   NULL,                              now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', NULL,        'applied',   NULL,                              now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'applied',   'withdrawn', 'Acepté otra oferta.',             now() - interval '2 days');

COMMIT;
