import jwt from "jsonwebtoken";
import { createGroup as modelCreateGroup, findByAccount } from "../models/groupList_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
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