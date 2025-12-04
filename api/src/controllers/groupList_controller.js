import jwt from "jsonwebtoken";
import * as model from "../models/groupList_model.js";

const modelCreateGroup = model.createGroup;
const findByAccount = model.findByAccount;
const modelGetGroups = model.getGroups;
const modelDeleteGroup = model.deleteGroup;
const modelGetGroupMembers = model.getGroupMembers;
const modelAddGroupMember = model.addGroupMember;
const modelUpdateMemberRole = model.updateMemberRole;
const modelGetMembership = model.getMembership;

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function getGroups(req, res, next) {
  try {
    // attempt to determine current user from token so we can annotate each group with the user's role (if any)
    const token = extractToken(req);
    let account_id = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        account_id = decoded && decoded.account_id ? decoded.account_id : null;
      } catch (err) {
        account_id = null;
      }
    }

    const rows = await modelGetGroups();
    // map DB columns to frontend shape (id, name, description, image)
    const groups = [];
    for (const r of (rows || [])) {
      const g = {
        id: r.group_id,
        name: r.group_name,
        description: null,
        image: null,
        account_id: r.account_id,
        role_status: null, // will set below if membership exists for current user
        created_at: r.created_at
      };

      if (account_id) {
        try {
          const membership = await modelGetMembership(r.group_id, account_id);
          if (membership && membership.role_status) {
            g.role_status = membership.role_status; // 1,2,3
          } else {
            g.role_status = null;
          }
        } catch (e) {
          console.warn("[getGroups] failed to get membership for group", r.group_id, e && e.message ? e.message : e);
          g.role_status = null;
        }
      } else {
        // no authenticated user: leave role_status null
        g.role_status = null;
      }

      groups.push(g);
    }

    return res.json(groups);
  } catch (err) {
    console.error("[getGroups] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

export async function createGroup(req, res, next) {
  try {
    console.log("[createGroup] body:", req.body);
    // try token first
    const token = extractToken(req);
    let account_id = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        account_id = decoded && decoded.account_id ? decoded.account_id : null;
      } catch (err) {
        // invalid token — ignore and try body fallback
        console.log("[createGroup] invalid token:", err.message);
        account_id = null;
      }
    }

    // fallback to body.account_id (quick local test) or dev default
    if (!account_id) {
      account_id = req.body && req.body.account_id ? req.body.account_id : null;
    }
    if (!account_id) {
      // optional: dev fallback if you want to allow local testing
      if (process.env.NODE_ENV !== "production") {
        account_id = 1;
        console.log("[createGroup] using dev fallback account_id=1");
      } else {
        return res.status(400).json({ error: "Missing account_id (authenticate or include account_id in body)" });
      }
    }

    const { group_name, role_status } = req.body || {};
    if (!group_name || String(group_name).trim() === "") {
      return res.status(400).json({ error: "Missing group_name" });
    }

    const group = await modelCreateGroup(account_id, String(group_name).trim(), role_status || 1);
    console.log("[createGroup] inserted:", group);

    // link creator as owner in group_members (role_status = 1)
    try {
      await modelAddGroupMember(group.group_id, account_id, 1);
    } catch (e) {
      console.error("[createGroup] failed to insert into group_members:", e);
      // continue — group created even if linking fails
    }

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    console.error("[createGroup] error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

export async function getOwnGroups(req, res, next) {
  try {
    console.log("[getOwnGroups] req.query:", req.query);
    // try token first
    const token = extractToken(req);
    let account_id = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        account_id = decoded && decoded.account_id ? decoded.account_id : null;
      } catch (err) {
        console.log("[getOwnGroups] invalid token:", err.message);
        account_id = null;
      }
    }

    // fallback to query param ?account_id=1 or body.account_id (for manual testing)
    if (!account_id) {
      account_id = req.query && req.query.account_id ? Number(req.query.account_id) : null;
    }
    if (!account_id && req.body && req.body.account_id) {
      account_id = Number(req.body.account_id);
    }

    // dev fallback for local testing
    if (!account_id) {
      if (process.env.NODE_ENV !== "production") {
        account_id = 1;
        console.log("[getOwnGroups] using dev fallback account_id=1");
      } else {
        return res.status(401).json({ error: "Missing account_id (authenticate or include account_id in query/body)" });
      }
    }

    console.log("[getOwnGroups] fetching groups for account_id:", account_id);
    const groups = await findByAccount(account_id);
    return res.json(groups || []);
  } catch (err) {
    console.error("[getOwnGroups] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
export async function deleteGroup(req, res, next) {
  try {
    const idFromParams = req.params && req.params.id;
    const idFromBody = req.body && req.body.id;
    const idRaw = idFromParams ?? idFromBody;
    const group_id = idRaw ? parseInt(idRaw, 10) : NaN;

    if (!group_id || Number.isNaN(group_id)) {
      return res.status(400).json({ error: "Invalid or missing group id" });
    }

    const deleted = await modelDeleteGroup(group_id);
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("[deleteGroup] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
export async function getGroupMembers(req, res, next) {
  try {
    const idRaw = req.params && req.params.id;
    const group_id = idRaw ? parseInt(idRaw, 10) : NaN;
    if (!group_id || Number.isNaN(group_id)) {
      return res.status(400).json({ error: "Invalid or missing group id" });
    }

    const members = await modelGetGroupMembers(group_id);
    // return as array of { account_id, username, email, role_status, member_id, joined_at }
    return res.json(members || []);
  } catch (err) {
    console.error("[getGroupMembers] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// New: request to join group -> creates pending member (role_status = 3)
export async function requestJoinGroup(req, res, next) {
  try {
    // require the specific helpers we need here
    if (typeof modelGetMembership !== "function" || typeof modelAddGroupMember !== "function") {
      console.error("[requestJoinGroup] required model functions missing:", {
        getMembership: typeof modelGetMembership === "function",
        addGroupMember: typeof modelAddGroupMember === "function",
      });
      return res.status(500).json({ error: "Server misconfiguration: membership functions not available" });
    }

    const token = extractToken(req);
    let account_id = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        account_id = decoded && decoded.account_id ? decoded.account_id : null;
      } catch (err) {
        account_id = null;
      }
    }
    if (!account_id && req.body && req.body.account_id) {
      account_id = Number(req.body.account_id);
    }
    if (!account_id) {
      return res.status(401).json({ error: "Missing account_id (authenticate or include account_id in body)" });
    }

    const groupIdRaw = req.body && (req.body.group_id || (req.params && req.params.id));
    const group_id = groupIdRaw ? Number(groupIdRaw) : NaN;
    if (!group_id || Number.isNaN(group_id)) {
      return res.status(400).json({ error: "Missing or invalid group_id" });
    }

    // check existing membership first
    const existing = await modelGetMembership(group_id, account_id);
    if (existing) {
      if (existing.role_status === 1) {
        return res.status(400).json({ error: "You are the owner of this group" });
      }
      if (existing.role_status === 2) {
        return res.status(400).json({ error: "You are already a member of this group" });
      }
      if (existing.role_status === 3) {
        return res.status(200).json({ message: "Join request already pending", member: existing });
      }
    }

    // insert pending membership (role_status = 3)
    const member = await modelAddGroupMember(group_id, account_id, 3);
    if (!member) {
      return res.status(500).json({ error: "Failed to create join request" });
    }
    return res.status(201).json({ message: "Join request created", member });
  } catch (err) {
    console.error("[requestJoinGroup] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// Optional: approve member (set to role_status = 2) — requires auth checks in production
export async function approveMember(req, res, next) {
  try {
    const group_id = req.params && req.params.groupId ? Number(req.params.groupId) : (req.body && Number(req.body.group_id));
    const account_id = req.body && Number(req.body.account_id);
    if (!group_id || !account_id) return res.status(400).json({ error: "Missing group_id or account_id" });

    const updated = await modelUpdateMemberRole(group_id, account_id, 2);
    if (!updated) return res.status(404).json({ error: "Member not found" });
    return res.json({ message: "Member approved", member: updated });
  } catch (err) {
    console.error("[approveMember] error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}