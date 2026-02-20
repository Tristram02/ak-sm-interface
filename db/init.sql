
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  created_at    TIMESTAMPTZ         DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buildings (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  ip_address      VARCHAR(45)  NOT NULL,
  port            INTEGER      NOT NULL DEFAULT 6080,
  device_user     VARCHAR(100),
  device_password VARCHAR(255),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schemes (
  id          SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  rows        INTEGER      NOT NULL DEFAULT 10,
  cols        INTEGER      NOT NULL DEFAULT 12,
  rooms       JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER schemes_updated_at BEFORE UPDATE ON schemes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
