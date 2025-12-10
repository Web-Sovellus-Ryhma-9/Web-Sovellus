import pool from "../database.js";

export async function findByUsername(username) {
  const sql = `SELECT * FROM account WHERE username = $1`;
  const { rows } = await pool.query(sql, [username]);
  return rows[0];
}

export async function findByEmail(email) {
  const sql = `SELECT * FROM account WHERE email = $1`;
  const { rows } = await pool.query(sql, [email]);
  return rows[0];
}

export async function createAccount(username, email, password_hash, avatar = "avatars/default.png") {
  const sql = `INSERT INTO account (username, email, password_hash, avatar) VALUES ($1, $2, $3, $4) RETURNING account_id, username, email, avatar`;
  const { rows } = await pool.query(sql, [username, email, password_hash, avatar]);
  return rows[0];
}

export async function findByUsernameOrEmail(identifier) {
  const sql = `SELECT * FROM account WHERE username = $1 OR email = $1`;
  const { rows } = await pool.query(sql, [identifier]);
  return rows[0];
}

export async function deleteAccountById(account_id) {
  const sql = `DELETE FROM account WHERE account_id = $1 RETURNING account_id`;
  const { rows } = await pool.query(sql, [account_id]);
  return rows[0];
}

export async function updateAvatar(account_id, avatar) {
  const sql = `UPDATE account SET avatar = $2 WHERE account_id = $1 RETURNING account_id, username, email, avatar`;
  const { rows } = await pool.query(sql, [account_id, avatar]);
  return rows[0];
}

export async function findById(account_id) {
  const sql = `SELECT account_id, username, email, avatar FROM account WHERE account_id = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [account_id]);
  return rows[0];
}
