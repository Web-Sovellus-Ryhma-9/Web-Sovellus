import pool from "../database.js";

export async function getAllGroups() {
  const sql = `SELECT group_id, account_id, group_name, description, created_at FROM groupList ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql);
  return rows;
}

export async function getGroupById(group_id) {
  const sql = `SELECT group_id, account_id, group_name, description, created_at FROM groupList WHERE group_id = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [group_id]);
  return rows[0];
}

export async function createGroup(account_id, group_name, description = null) {
  const sql = `INSERT INTO groupList (account_id, group_name, description) VALUES ($1, $2, $3) RETURNING group_id, account_id, group_name, description, created_at`;
  const { rows } = await pool.query(sql, [account_id, String(group_name), description]);
  return rows[0];
}

export async function deleteGroup(group_id) {
  const sql = `DELETE FROM groupList WHERE group_id = $1 RETURNING group_id`;
  const { rows } = await pool.query(sql, [group_id]);
  return rows[0];
}

export async function updateGroupName(group_id, group_name, description = null) {
  const sql = `UPDATE groupList SET group_name = $2, description = $3 WHERE group_id = $1 RETURNING group_id, account_id, group_name, description, created_at`;
  const { rows } = await pool.query(sql, [group_id, String(group_name), description]);
  return rows[0];
}

export async function getMembersForGroup(group_id) {
  const sql = `
    SELECT gm.member_id, gm.account_id, gm.role_status, gm.joined_at, a.username, a.avatar
    FROM group_members gm
    LEFT JOIN account a ON a.account_id = gm.account_id
    WHERE gm.group_id = $1
    ORDER BY gm.joined_at DESC
  `;
  const { rows } = await pool.query(sql, [group_id]);
  return rows;
}

export async function findMember(group_id, account_id) {
  const sql = `SELECT * FROM group_members WHERE group_id = $1 AND account_id = $2 LIMIT 1`;
  const { rows } = await pool.query(sql, [group_id, account_id]);
  return rows[0];
}

export async function findMemberByAnyId(id) {
  const sql = `SELECT * FROM group_members WHERE member_id = $1 OR account_id = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [id]);
  return rows[0];
}

export async function addMember(group_id, account_id, role_status = 3) {
  const sql = `INSERT INTO group_members (group_id, account_id, role_status) VALUES ($1, $2, $3) RETURNING member_id, group_id, account_id, role_status, joined_at`;
  const { rows } = await pool.query(sql, [group_id, account_id, role_status]);
  return rows[0];
}

export async function updateMemberRole(group_id, account_id, role_status) {
  const sql = `UPDATE group_members SET role_status = $3 WHERE group_id = $1 AND account_id = $2 RETURNING member_id, group_id, account_id, role_status`;
  const { rows } = await pool.query(sql, [group_id, account_id, role_status]);
  return rows[0];
}

export async function removeMemberById(member_id) {
  const sql = `DELETE FROM group_members WHERE member_id = $1 RETURNING member_id, group_id, account_id`;
  const { rows } = await pool.query(sql, [member_id]);
  return rows[0];
}

export async function removeMemberByAccount(group_id, account_id) {
  const sql = `DELETE FROM group_members WHERE group_id = $1 AND account_id = $2 RETURNING member_id, group_id, account_id`;
  const { rows } = await pool.query(sql, [group_id, account_id]);
  return rows[0];
}

export async function getMoviesForGroup(group_id) {
  const sql = `SELECT id, group_id, movie_id, title, image, added_at FROM group_movies WHERE group_id = $1 ORDER BY added_at DESC`;
  const { rows } = await pool.query(sql, [group_id]);
  return rows;
}

export async function addGroupMovie(group_id, movie_id, title = null, image = null) {
  const sql = `INSERT INTO group_movies (group_id, movie_id, title, image) VALUES ($1, $2, $3, $4) RETURNING id, group_id, movie_id, title, image, added_at`;
  const { rows } = await pool.query(sql, [group_id, String(movie_id), title, image]);
  return rows[0];
}

export async function removeGroupMovie(group_id, movie_id) {
  const sql = `DELETE FROM group_movies WHERE group_id = $1 AND movie_id = $2 RETURNING id, group_id, movie_id`;
  const { rows } = await pool.query(sql, [group_id, String(movie_id)]);
  return rows[0];
}
