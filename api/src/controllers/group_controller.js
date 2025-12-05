import jwt from "jsonwebtoken";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  deleteGroup,
  getMembersForGroup,
  findMember,
  findMemberByAnyId,
  addMember,
  updateMemberRole,
  removeMemberById,
  removeMemberByAccount,
} from "../models/group_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function extractAccount(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  try {
    return jwt.verify(parts[1], JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getGroups(req, res, next) {
  try {
    const acct = extractAccount(req);
    const account_id = acct ? acct.account_id : null;

    const groups = await getAllGroups();

    // augment each group with role_status relative to the requesting user
    const out = await Promise.all(groups.map(async (g) => {
      let role_status = 0; // default: not member (0 = not member, 1 = owner, 2 = member, 3 = pending)
      if (account_id) {
        if (Number(g.account_id) === Number(account_id)) {
          role_status = 1; // owner
        } else {
          const m = await findMember(g.group_id, account_id);
          if (m) role_status = m.role_status;
        }
      }
      return {
        group_id: g.group_id,
        id: g.group_id,
        name: g.group_name,
        group_name: g.group_name,
        description: g.description || "",
        account_id: g.account_id,
        created_at: g.created_at,
        role_status,
      };
    }));

    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function createNewGroup(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const account_id = acct.account_id;
    const { group_name, name } = req.body || {};
    const gname = (group_name || name || "").trim();
    if (!gname) return res.status(400).json({ error: "Missing group name" });

    const created = await createGroup(account_id, gname);
    // add owner as member with role_status 1
    await addMember(created.group_id, account_id, 1).catch(() => null);

    res.status(201).json({ message: "Group created", group: { group_id: created.group_id, name: created.group_name } });
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const account_id = acct.account_id;
    const groupId = req.params.id;
    if (!groupId) return res.status(400).json({ error: "Missing group id" });

    const g = await getGroupById(groupId);
    if (!g) return res.status(404).json({ error: "Group not found" });
    if (Number(g.account_id) !== Number(account_id)) return res.status(403).json({ error: "Forbidden" });

    const deleted = await deleteGroup(groupId);
    if (!deleted) return res.status(404).json({ error: "Group not found" });
    res.json({ message: "Group deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req, res, next) {
  try {
    const groupId = req.params.id;
    if (!groupId) return res.status(400).json({ error: "Missing group id" });
    const rows = await getMembersForGroup(groupId);
    // map fields to what frontend expects
    res.json(rows.map(r => ({ member_id: r.member_id, account_id: r.account_id, username: r.username, role_status: r.role_status })));
  } catch (err) {
    next(err);
  }
}

export async function joinGroupHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const account_id = acct.account_id;
    const { group_id } = req.body || {};
    if (!group_id) return res.status(400).json({ error: "Missing group_id" });

    // check if already a member
    const existing = await findMember(group_id, account_id);
    if (existing) {
      if (existing.role_status === 3) return res.status(200).json({ message: "Request already pending" });
      return res.status(409).json({ error: "Already a member" });
    }

    const added = await addMember(group_id, account_id, 3);
    res.status(201).json({ message: "Join request created", member: added });
  } catch (err) {
    // unique constraint errors produce 400-like PG errors; surface as 409
    console.error('joinGroupHandler error', err);
    next(err);
  }
}

export async function approveMemberHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const account_id = acct.account_id;
    const { group_id, account_id: targetAccount } = req.body || {};
    if (!group_id || !targetAccount) return res.status(400).json({ error: "Missing data" });

    const g = await getGroupById(group_id);
    if (!g) return res.status(404).json({ error: "Group not found" });
    if (Number(g.account_id) !== Number(account_id)) return res.status(403).json({ error: "Forbidden" });

    const updated = await updateMemberRole(group_id, targetAccount, 2);
    if (!updated) return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member approved", member: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteMemberHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const requester = acct.account_id;
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const m = await findMemberByAnyId(id);
    if (!m) return res.status(404).json({ error: "Member not found" });

    // allow if requester is the same account or owner of the group
    const g = await getGroupById(m.group_id);
    const isOwner = g && Number(g.account_id) === Number(requester);
    const isSelf = Number(m.account_id) === Number(requester);
    if (!isOwner && !isSelf) return res.status(403).json({ error: "Forbidden" });

    const removed = await removeMemberById(m.member_id);
    res.json({ message: "Member removed", removed });
  } catch (err) {
    next(err);
  }
}
