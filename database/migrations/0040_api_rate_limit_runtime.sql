-- SBGlobal Plus — Migration 0040: distributed rate-limit runtime state
-- DD-050 / DEV-API-RATE-LIMIT-001
BEGIN;

CREATE TABLE core_integration.rate_limit_bucket (
  bucket_key_hash text PRIMARY KEY
    CHECK (bucket_key_hash ~ '^[0-9a-f]{64}$'),
  policy_version integer NOT NULL CHECK (policy_version > 0),
  rate_class text NOT NULL,
  dimension text NOT NULL
    CHECK (dimension IN ('IP','PRINCIPAL','CREDENTIAL','TENANT','ENDPOINT')),
  capacity numeric(20,6) NOT NULL CHECK (capacity > 0),
  refill_per_second numeric(20,10) NOT NULL CHECK (refill_per_second > 0),
  tokens numeric(20,6) NOT NULL CHECK (tokens >= 0),
  last_refill_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE core_integration.rate_limit_concurrency_lease (
  lease_id uuid PRIMARY KEY,
  bucket_key_hash text NOT NULL
    REFERENCES core_integration.rate_limit_bucket(bucket_key_hash) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX rate_limit_concurrency_lease_bucket_expiry_idx
  ON core_integration.rate_limit_concurrency_lease(bucket_key_hash,expires_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_rate_limiter_rw') THEN
    CREATE ROLE sbg_rate_limiter_rw
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA core_integration TO sbg_rate_limiter_rw;
GRANT SELECT,INSERT,UPDATE ON core_integration.rate_limit_bucket TO sbg_rate_limiter_rw;
GRANT SELECT,INSERT,DELETE ON core_integration.rate_limit_concurrency_lease TO sbg_rate_limiter_rw;

REVOKE DELETE ON core_integration.rate_limit_bucket FROM sbg_rate_limiter_rw;
REVOKE UPDATE ON core_integration.rate_limit_concurrency_lease FROM sbg_rate_limiter_rw;

-- Operational limiter state is deliberately outside tenant RLS because rows contain
-- no raw Tenant/Industry/principal/IP/credential identifiers: only one-way SHA-256
-- bucket identities plus limiter metadata. Access is isolated by a dedicated role.
REVOKE ALL PRIVILEGES ON
  core_integration.rate_limit_bucket,
  core_integration.rate_limit_concurrency_lease
FROM sbg_app_rw, sbg_integration_service_rw, sbg_authorization_compiler_rw, sbg_control_plane_rw;

COMMIT;
