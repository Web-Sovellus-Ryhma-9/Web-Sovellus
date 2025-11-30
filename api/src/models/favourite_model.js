import pool from "../database.js";

export async function getFavoritesByAccount(account_id) {
  const sql = `
    SELECT fi.movie_id, fi.title, fl.favourite_id, fl.Movielist
    FROM favourite_items fi
    JOIN favouritelist fl ON fi.favourite_id = fl.favourite_id
    WHERE fl.account_id = $1
    ORDER BY fi.id DESC
  `;
  const { rows } = await pool.query(sql, [account_id]);
  return rows;
}

export async function getFavoritesByListId(favourite_id) {
  const sql = `
    SELECT fi.movie_id, fi.title, fl.favourite_id, fl.Movielist
    FROM favourite_items fi
    JOIN favouritelist fl ON fi.favourite_id = fl.favourite_id
    WHERE fi.favourite_id = $1
    ORDER BY fi.id DESC
  `;
  const { rows } = await pool.query(sql, [favourite_id]);
  return rows;
}

export async function addFavoriteToList(favourite_id, movie_id, title) {
  const sql = `INSERT INTO favourite_items (favourite_id, movie_id, title) VALUES ($1, $2, $3) RETURNING id, movie_id, title`;
  const { rows } = await pool.query(sql, [favourite_id, movie_id, title]);
  return rows[0];
}

export async function removeFavoriteFromList(favourite_id, movie_id) {
  const sql = `DELETE FROM favourite_items WHERE favourite_id = $1 AND movie_id = $2 RETURNING id`;
  const { rows } = await pool.query(sql, [favourite_id, movie_id]);
  return rows[0];
}

export async function getOrCreateDefaultListForAccount(account_id) {
  // For compatibility with frontend which expects a single list per account,
  // we create or return a default list named 'Favorites'.
  const find = `SELECT * FROM favouritelist WHERE account_id = $1 LIMIT 1`;
  let { rows } = await pool.query(find, [account_id]);
  if (rows.length > 0) return rows[0];

  const insert = `INSERT INTO favouritelist (account_id, Movielist) VALUES ($1, $2) RETURNING *`;
  ({ rows } = await pool.query(insert, [account_id, 'Favorites']));
  return rows[0];
}

export async function findFavoriteByAccountAndMovie(account_id, movie_id) {
  const sql = `
    SELECT fi.* FROM favourite_items fi
    JOIN favouritelist fl ON fi.favourite_id = fl.favourite_id
    WHERE fl.account_id = $1 AND fi.movie_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [account_id, movie_id]);
  return rows[0];
}
