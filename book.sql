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

-- FavouriteList table: stores per-account favourite lists
-- Use lowercase table name so Postgres unquoted identifiers match
DROP TABLE IF EXISTS favouritelist;
CREATE TABLE IF NOT EXISTS favouritelist (
  favourite_id SERIAL PRIMARY KEY,
  account_id INT NOT NULL,
  Movielist VARCHAR(255) NOT NULL,
  CONSTRAINT fk_favourite_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
);

-- Items belonging to FavouriteList (map favourite list -> movie)
DROP TABLE IF EXISTS favourite_items;
CREATE TABLE IF NOT EXISTS favourite_items (
  id SERIAL PRIMARY KEY,
  favourite_id INT NOT NULL,
  movie_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  CONSTRAINT fk_favourite_list FOREIGN KEY (favourite_id) REFERENCES favouritelist(favourite_id) ON DELETE CASCADE,
  CONSTRAINT uniq_favitem UNIQUE (favourite_id, movie_id)
);