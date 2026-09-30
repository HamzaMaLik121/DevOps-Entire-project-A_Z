-- AnimeThreads: one schema per microservice.
-- Mounted into /docker-entrypoint-initdb.d/ — runs on FIRST boot only
-- (when the pgdata volume is empty). Idempotent regardless.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS product;
CREATE SCHEMA IF NOT EXISTS order;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS inventory;
