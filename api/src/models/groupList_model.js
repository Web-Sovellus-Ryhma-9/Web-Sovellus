import pool from "../database.js";

export async function createGroup(account_id, group_name, role_status = 1) {
  const sql = `
    INSERT INTO groupList (account_id, group_name, role_status)
    VALUES ($1, $2, $3)
    RETURNING group_id, account_id, group_name, role_status, created_at
  `;
  try {
    console.log("[groupList_model] insert params:", { account_id, group_name, role_status });
    const { rows } = await pool.query(sql, [account_id, group_name, role_status]);
    console.log("[groupList_model] insert result:", rows[0]);
    return rows[0];
  } catch (err) {
    console.error("[groupList_model] DB error on insert:", err && err.message ? err.message : err);
    throw err;
  }
}
export async function getGroups() {
  const sql = `
    SELECT group_id, account_id, group_name, role_status, created_at
    FROM groupList
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(sql);
  return rows;
}


export async function findByAccount(account_id) {
  const sql = `
    SELECT group_id, account_id, group_name, role_status, created_at
    FROM groupList
    WHERE account_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(sql, [account_id]);
  return rows;
}