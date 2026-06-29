-- ============================================================
-- Job Board Platform - PostgreSQL DDL
-- Tables + Constraints + Foreign Keys + Indexes
-- ============================================================


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE employment_type_enum AS ENUM (
    'full-time',
    'part-time',
    'contract'
);

CREATE TYPE job_status_enum AS ENUM (
    'open',
    'closed',
    'draft'
);

CREATE TYPE application_status_enum AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'rejected'
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT NULL,
    years_of_experience INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT uq_users_email UNIQUE (email),

    CONSTRAINT chk_users_years_of_experience_non_negative
        CHECK (years_of_experience >= 0),

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_users_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_users_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    website VARCHAR(2048) NULL,
    location VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT fk_companies_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_companies_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_companies_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- SKILLS
-- ============================================================

CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT uq_skills_name UNIQUE (name),

    CONSTRAINT fk_skills_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_skills_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_skills_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    salary_min INT NOT NULL,
    salary_max INT NOT NULL,
    employment_type employment_type_enum NOT NULL,
    status job_status_enum NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT chk_jobs_salary_min_non_negative
        CHECK (salary_min >= 0),

    CONSTRAINT chk_jobs_salary_max_greater_or_equal_min
        CHECK (salary_max >= salary_min),

    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,

    CONSTRAINT fk_jobs_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_jobs_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_jobs_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- JOB APPLICATIONS
-- ============================================================

CREATE TABLE job_applications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,

    cover_letter TEXT NULL,
    status application_status_enum NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT uq_job_applications_user_job
        UNIQUE (user_id, job_id),

    CONSTRAINT fk_job_applications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT fk_job_applications_job
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,

    CONSTRAINT fk_job_applications_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_job_applications_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_job_applications_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- USER SKILLS
-- many-to-many between users and skills
-- ============================================================

CREATE TABLE user_skills (
    user_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT pk_user_skills
        PRIMARY KEY (user_id, skill_id),

    CONSTRAINT fk_user_skills_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_user_skills_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_user_skills_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- JOB SKILLS
-- many-to-many between jobs and skills
-- ============================================================

CREATE TABLE job_skills (
    job_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_by BIGINT NULL,

    CONSTRAINT pk_job_skills
        PRIMARY KEY (job_id, skill_id),

    CONSTRAINT fk_job_skills_job
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,

    CONSTRAINT fk_job_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,

    CONSTRAINT fk_job_skills_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_job_skills_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_job_skills_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- INDEXES
-- ============================================================

-- NOTE:
-- users.email already has an index because of UNIQUE constraint.
-- skills.name already has an index because of UNIQUE constraint.
-- job_applications(user_id, job_id) already has an index because of UNIQUE constraint.
-- user_skills(user_id, skill_id) already has an index because of PRIMARY KEY.
-- job_skills(job_id, skill_id) already has an index because of PRIMARY KEY.


-- Companies
CREATE INDEX idx_companies_location
ON companies (location);

CREATE INDEX idx_companies_is_verified
ON companies (is_verified);

CREATE INDEX idx_companies_deleted_at
ON companies (deleted_at);


-- Jobs
CREATE INDEX idx_jobs_company_id
ON jobs (company_id);

CREATE INDEX idx_jobs_location
ON jobs (location);

CREATE INDEX idx_jobs_employment_type
ON jobs (employment_type);

CREATE INDEX idx_jobs_status
ON jobs (status);

CREATE INDEX idx_jobs_salary_min_salary_max
ON jobs (salary_min, salary_max);

CREATE INDEX idx_jobs_status_location_employment_type
ON jobs (status, location, employment_type);

CREATE INDEX idx_jobs_created_at
ON jobs (created_at DESC);

CREATE INDEX idx_jobs_deleted_at
ON jobs (deleted_at);


-- Job Applications
CREATE INDEX idx_job_applications_user_id
ON job_applications (user_id);

CREATE INDEX idx_job_applications_job_id
ON job_applications (job_id);

CREATE INDEX idx_job_applications_status
ON job_applications (status);

CREATE INDEX idx_job_applications_deleted_at
ON job_applications (deleted_at);


-- Skills
CREATE INDEX idx_skills_deleted_at
ON skills (deleted_at);


-- User Skills
CREATE INDEX idx_user_skills_skill_id
ON user_skills (skill_id);

CREATE INDEX idx_user_skills_deleted_at
ON user_skills (deleted_at);


-- Job Skills
CREATE INDEX idx_job_skills_skill_id
ON job_skills (skill_id);

CREATE INDEX idx_job_skills_deleted_at
ON job_skills (deleted_at);


-- Audit FK fields
CREATE INDEX idx_users_created_by
ON users (created_by);

CREATE INDEX idx_users_updated_by
ON users (updated_by);

CREATE INDEX idx_users_deleted_by
ON users (deleted_by);

CREATE INDEX idx_companies_created_by
ON companies (created_by);

CREATE INDEX idx_companies_updated_by
ON companies (updated_by);

CREATE INDEX idx_companies_deleted_by
ON companies (deleted_by);

CREATE INDEX idx_jobs_created_by
ON jobs (created_by);

CREATE INDEX idx_jobs_updated_by
ON jobs (updated_by);

CREATE INDEX idx_jobs_deleted_by
ON jobs (deleted_by);

CREATE INDEX idx_job_applications_created_by
ON job_applications (created_by);

CREATE INDEX idx_job_applications_updated_by
ON job_applications (updated_by);

CREATE INDEX idx_job_applications_deleted_by
ON job_applications (deleted_by);

CREATE INDEX idx_skills_created_by
ON skills (created_by);

CREATE INDEX idx_skills_updated_by
ON skills (updated_by);

CREATE INDEX idx_skills_deleted_by
ON skills (deleted_by);

CREATE INDEX idx_user_skills_created_by
ON user_skills (created_by);

CREATE INDEX idx_user_skills_updated_by
ON user_skills (updated_by);

CREATE INDEX idx_user_skills_deleted_by
ON user_skills (deleted_by);

CREATE INDEX idx_job_skills_created_by
ON job_skills (created_by);

CREATE INDEX idx_job_skills_updated_by
ON job_skills (updated_by);

CREATE INDEX idx_job_skills_deleted_by
ON job_skills (deleted_by);