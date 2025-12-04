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
  // Return groups where the given account is a member/owner (role_status 1 = owner, 2 = member)
  const sql = `
    SELECT
      g.group_id,
      g.group_name,
      g.account_id AS owner_account_id,
      gm.account_id AS member_account_id,
      gm.role_status,
      g.created_at
    FROM groupList g
    JOIN group_members gm ON gm.group_id = g.group_id
    WHERE gm.account_id = $1
      AND gm.role_status IN (1,2)
    ORDER BY g.created_at DESC
  `;
  const { rows } = await pool.query(sql, [account_id]);
  // normalize shape similar to previous API expectations if needed
  return rows.map(r => ({
    group_id: r.group_id,
    group_name: r.group_name,
    account_id: r.owner_account_id,
    role_status: r.role_status,
    created_at: r.created_at
  }));
}

export async function deleteGroup(group_id) {
  const sql = `
    DELETE FROM groupList
    WHERE group_id = $1
    RETURNING group_id
  `;
  const { rows } = await pool.query(sql, [group_id]);
  return rows; 
}

export async function getGroupMembers(group_id) {
  const sql = `
    SELECT a.account_id, a.username, a.email, gm.role_status, gm.member_id, gm.joined_at
    FROM group_members gm
    JOIN account a ON a.account_id = gm.account_id
    WHERE gm.group_id = $1
    ORDER BY gm.joined_at ASC
  `;
  const { rows } = await pool.query(sql, [group_id]);
  return rows;
}

// new: get single membership row for given user+group
export async function getMembership(group_id, account_id) {
  const sql = `
    SELECT member_id, group_id, account_id, role_status, joined_at
    FROM group_members
    WHERE group_id = $1 AND account_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [group_id, account_id]);
  return rows[0] || null;
}

export async function addGroupMember(group_id, account_id, role_status = 3) {
  const sql = `
    INSERT INTO group_members (group_id, account_id, role_status)
    VALUES ($1, $2, $3)
    ON CONFLICT (group_id, account_id) DO UPDATE
      SET role_status = EXCLUDED.role_status
      WHERE group_members.role_status NOT IN (1,2) -- do NOT overwrite owner(1) or member(2)
    RETURNING member_id, group_id, account_id, role_status, joined_at
  `;
  const { rows } = await pool.query(sql, [group_id, account_id, role_status]);
  return rows[0];
}

export async function updateMemberRole(group_id, account_id, role_status) {
  const sql = `
    UPDATE group_members
    SET role_status = $3
    WHERE group_id = $1 AND account_id = $2
    RETURNING member_id, group_id, account_id, role_status
  `;
  const { rows } = await pool.query(sql, [group_id, account_id, role_status]);
  return rows[0];
}