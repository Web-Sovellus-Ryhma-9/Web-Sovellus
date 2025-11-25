DROP TABLE IF EXISTS account;

CREATE TABLE IF NOT EXISTS account (
  account_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

DROP TABLE IF EXISTS groupList;
CREATE TABLE IF NOT EXISTS groupList (
  group_id   SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  role_status INTEGER NOT NULL DEFAULT 3, -- 1=admin, 2=member, 3=not member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);