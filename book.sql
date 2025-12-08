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
  description TEXT,
  -- role_status removed from groupList: per-account role is stored in group_members
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

-- Reviews table: store movie reviews so that users can post and others can read them
DROP TABLE IF EXISTS reviews;
CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL PRIMARY KEY,
  movie_id VARCHAR(255) NOT NULL,
  account_id INT,
  username VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_review_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS group_members;
CREATE TABLE IF NOT EXISTS group_members (
  member_id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groupList(group_id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  role_status INTEGER NOT NULL DEFAULT 3, -- 1=owner, 2=member, 3=pending (0 = not member / no membership row)
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, account_id)
);