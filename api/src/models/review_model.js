import pool from "../database.js";

export async function getReviewsByMovie(movie_id) {
  const sql = `
    SELECT review_id, movie_id, account_id, username, rating, comment, created_at
    FROM reviews
    WHERE movie_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(sql, [String(movie_id)]);
  return rows;
}

export async function addReview(movie_id, account_id, username, rating, comment) {
  const sql = `
    INSERT INTO reviews (movie_id, account_id, username, rating, comment)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING review_id, movie_id, account_id, username, rating, comment, created_at
  `;
  const { rows } = await pool.query(sql, [String(movie_id), account_id || null, username || null, rating, comment || null]);
  return rows[0];
}

export async function findReviewByAccountAndMovie(account_id, movie_id) {
  const sql = `
    SELECT review_id, movie_id, account_id, username, rating, comment, created_at
    FROM reviews
    WHERE account_id = $1 AND movie_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [account_id, String(movie_id)]);
  return rows[0];
}

export async function removeReviewByAccountAndMovie(account_id, movie_id) {
  const sql = `
    DELETE FROM reviews
    WHERE account_id = $1 AND movie_id = $2
    RETURNING review_id, movie_id, account_id, username, rating, comment, created_at
  `;
  const { rows } = await pool.query(sql, [account_id, String(movie_id)]);
  return rows[0];
}

export async function updateReviewByAccountAndMovie(account_id, movie_id, rating, comment) {
  const sql = `
    UPDATE reviews
    SET rating = $3,
        comment = $4,
        created_at = NOW()
    WHERE account_id = $1 AND movie_id = $2
    RETURNING review_id, movie_id, account_id, username, rating, comment, created_at
  `;
  const { rows } = await pool.query(sql, [account_id, String(movie_id), rating, comment || null]);
  return rows[0];
}