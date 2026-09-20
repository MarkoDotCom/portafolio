# Modelo de datos — marketplace laboral

Esquema PostgreSQL (13+) para una app tipo LinkedIn con dos actores:

- **Trabajador**: cuenta con `worker_profile`; publica su portafolio (experiencia, educación, certificaciones, proyectos, skills) y postula a ofertas.
- **Empleador**: cuenta miembro de una `company` (`company_member`); publica ofertas y gestiona el pipeline de postulantes.

Una misma cuenta puede ser ambas cosas y administrar varias empresas.

## Archivos

| Archivo      | Contenido                                                   |
|--------------|-------------------------------------------------------------|
| `schema.sql` | Esquemas, enums, tablas, constraints, índices y triggers `updated_at` |
| `seed.sql`   | Datos de ejemplo: 4 usuarios, 1 empresa, 3 ofertas, 3 postulaciones |

Con Docker (desde `proyectos/bolsa-laboral/`, credenciales en `.env`):

```bash
docker compose up -d db
docker compose exec db psql -U portafolio -d portafolio -c '\dt users.* workers.* companies.* public.*'
```

Los scripts se ejecutan solos la primera vez que se crea el volumen. Tras cambiar `schema.sql`: `docker compose down -v && docker compose up -d db`.

Con un Postgres propio:

```bash
createdb marketplace
psql -d marketplace -f schema.sql
psql -d marketplace -f seed.sql
```

## Esquemas

Las tablas se reparten en cuatro esquemas de PostgreSQL. Los nombres de tabla no cambian; en SQL se usan calificados (`users.app_user`).

| Esquema     | Tablas |
|-------------|--------|
| `users`     | `app_user`, `media_asset` |
| `workers`   | `worker_profile`, `social_link`, `experience`, `education`, `certification`, `project`, `project_media`, `worker_skill`, `experience_skill`, `project_skill` |
| `companies` | `company`, `company_member`, `job_posting`, `job_posting_skill`, `job_application`, `job_application_event` |
| `public`    | Enums, la función `set_updated_at()` y el catálogo `skill` |

En Prisma el datasource declara `schemas = ["public", "users", "workers", "companies"]` y cada modelo lleva `@@schema(...)`; los nombres de modelo siguen siendo los de las tablas.

## Diagrama ER

```mermaid
erDiagram
  app_user ||--o| worker_profile : "es trabajador"
  app_user ||--o{ company_member : ""
  company  ||--o{ company_member : "es empleador"
  app_user ||--o{ media_asset : "sube"

  worker_profile ||--o{ social_link : ""
  worker_profile ||--o{ experience : ""
  worker_profile ||--o{ education : ""
  worker_profile ||--o{ certification : ""
  worker_profile ||--o{ project : ""
  worker_profile ||--o{ worker_skill : ""
  worker_profile ||--o{ job_application : "postula"

  company  o|--o{ experience : "si está registrada"
  project  ||--o{ project_media : ""
  media_asset ||--o{ project_media : ""

  skill ||--o{ worker_skill : ""
  skill ||--o{ experience_skill : ""
  skill ||--o{ project_skill : ""
  skill ||--o{ job_posting_skill : ""
  experience ||--o{ experience_skill : ""
  project    ||--o{ project_skill : ""

  company     ||--o{ job_posting : "publica"
  job_posting ||--o{ job_posting_skill : "requiere"
  job_posting ||--o{ job_application : "recibe"
  job_application ||--o{ job_application_event : "historial"

  app_user {
    uuid id PK
    citext email UK
    text external_auth_id UK
    text full_name
  }
  worker_profile {
    uuid user_id PK_FK
    citext slug UK
    text headline
    bool is_public
    bool open_to_work
  }
  company {
    uuid id PK
    citext slug UK
    text name
    company_size size
  }
  company_member {
    uuid company_id PK_FK
    uuid user_id PK_FK
    company_role role
  }
  skill {
    uuid id PK
    citext name UK
    skill_category category
  }
  job_posting {
    uuid id PK
    uuid company_id FK
    text title
    job_status status
    timestamptz published_at
  }
  job_application {
    uuid id PK
    uuid job_posting_id FK
    uuid worker_id FK
    application_status status
  }
```

## Entidades

### Identidad y actores

| Tabla            | Descripción |
|------------------|-------------|
| `app_user`       | Cuenta. La identidad se delega a un proveedor externo (`external_auth_id`); no hay contraseña. |
| `worker_profile` | 1:1 opcional con `app_user`. Existir aquí = ser trabajador. `slug` es la URL pública. |
| `company`        | Empresa. `slug` es la URL pública. |
| `company_member` | N:M usuario ↔ empresa con `role` (`owner`, `recruiter`). Existir aquí = ser empleador. |
| `media_asset`    | Archivos subidos (avatar, logo, portadas). Referenciados por `app_user`, `company`, `project`. |

### Perfil del trabajador

| Tabla              | Descripción |
|--------------------|-------------|
| `experience`       | Empleos. `company_id` opcional enlaza a una empresa registrada; `company_name` siempre presente. `end_date NULL` = actualidad. |
| `education`        | Formación académica. |
| `certification`    | Certificaciones con emisor, vigencia y URL de credencial. |
| `project`          | Proyectos del portafolio; `slug` único por trabajador. |
| `project_media`    | Galería de un proyecto. |
| `social_link`      | Enlaces externos (GitHub, web, etc.). |

Todas llevan `is_visible` (borrador por ítem) y `sort_order` (orden manual).

### Skills

| Tabla               | Descripción |
|---------------------|-------------|
| `skill`             | Catálogo global, nombre único sin distinguir mayúsculas. |
| `worker_skill`      | Skills del trabajador con `level` 1–5. |
| `experience_skill`  | Tecnologías usadas en un empleo. |
| `project_skill`     | Tecnologías de un proyecto. |
| `job_posting_skill` | Skills de una oferta; `is_required = false` significa deseable. |

### Empleo

| Tabla                   | Descripción |
|-------------------------|-------------|
| `job_posting`           | Oferta de una empresa. `status`: `draft` → `published` → `closed`. Publicar exige `published_at`. |
| `job_application`       | Postulación; única por (oferta, trabajador). `status`: `applied`, `reviewing`, `interview`, `offer`, `rejected`, `withdrawn`. |
| `job_application_event` | Historial de cambios de estado: quién, de → a, nota. La aplicación inserta una fila en cada transición. |

## Convenciones

- Tablas en los esquemas `users`, `workers` y `companies` (ver arriba); enums y función compartida en `public`.
- PK `uuid` con `gen_random_uuid()`; timestamps `timestamptz`; `updated_at` mantenido por trigger.
- `ON DELETE CASCADE` desde `app_user`, `worker_profile` y `company`; `SET NULL` en referencias informativas (`created_by`, `company_id` en experiencia, medios).
- Estados y tipos como `ENUM` de Postgres. Para agregar un valor: `ALTER TYPE ... ADD VALUE`.
- Las transiciones válidas de `job_application.status` no se validan en la base; son responsabilidad de la aplicación, que también registra el evento.
- Rango salarial: si hay `salary_min` o `salary_max`, `salary_currency` es obligatorio (ISO 4217).

## Consultas típicas

```sql
-- Candidatos públicos y disponibles que tienen todas las skills requeridas de una oferta
SELECT wp.slug, u.full_name
FROM worker_profile wp
JOIN app_user u ON u.id = wp.user_id
WHERE wp.is_public AND wp.open_to_work
  AND NOT EXISTS (
    SELECT 1 FROM job_posting_skill jps
    WHERE jps.job_posting_id = '90000000-0000-4000-8000-000000000001'
      AND jps.is_required
      AND NOT EXISTS (
        SELECT 1 FROM worker_skill ws
        WHERE ws.worker_id = wp.user_id AND ws.skill_id = jps.skill_id
      )
  );

-- Pipeline de una oferta para el reclutador
SELECT ja.status, count(*) FROM job_application ja
WHERE ja.job_posting_id = '90000000-0000-4000-8000-000000000001'
GROUP BY ja.status;
```

## Fuera de alcance (v1)

Mensajería, ofertas guardadas, seguir empresas, red de contactos y feed. El modelo no los bloquea: cuelgan de `app_user`, `worker_profile` o `company` sin tocar lo existente.
