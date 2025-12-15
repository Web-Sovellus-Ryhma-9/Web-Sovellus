import jwt from "jsonwebtoken";
import { getMovieDetails, getTvDetails } from "../models/tmdb_model.js";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroupName,
  deleteGroup,
  getMembersForGroup,
  findMember,
  findMemberByAnyId,
  addMember,
  updateMemberRole,
  removeMemberById,
  removeMemberByAccount,
  getMoviesForGroup,
  addGroupMovie,
  removeGroupMovie,
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
    const out = await Promise.all(groups.map(async (g) => {
      let role_status = 0;
      if (account_id) {
        if (Number(g.account_id) === Number(account_id)) {
          role_status = 1;
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
    const { description } = req.body || {};
    const gname = (group_name || name || "").trim();
    if (!gname) return res.status(400).json({ error: "Missing group name" });

    const created = await createGroup(account_id, gname, description || null);
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
    res.json(rows.map(r => ({ member_id: r.member_id, account_id: r.account_id, username: r.username, avatar: r.avatar, role_status: r.role_status })));
  } catch (err) {
    next(err);
  }
}

export async function getGroupMovies(req, res, next) {
  try {
    const groupId = req.params.id;
    if (!groupId) return res.status(400).json({ error: 'Missing group id' });
    const rows = await getMoviesForGroup(groupId);
    const items = await Promise.all(rows.map(async (r) => {
      // Decode media_type from stored movie_id (format: "tv:123" or "movie:456")
      let id = r.movie_id;
      let media_type = 'movie';
      
      const parts = String(id).split(':');
      if (parts.length === 2 && (parts[0] === 'tv' || parts[0] === 'movie')) {
        media_type = parts[0];
        id = parts[1];
      } else {
        // Fallback to detection for old stored data
        try {
          await getMovieDetails(id);
          media_type = 'movie';
        } catch (e1) {
          try {
            await getTvDetails(id);
            media_type = 'tv';
          } catch (e2) {
            media_type = 'movie';
          }
        }
      }
      
      return { id: id, db_id: r.id, group_id: r.group_id, movie_id: id, title: r.title, image: r.image, added_at: r.added_at, media_type };
    }));
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function addMovieToGroupHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: 'Unauthorized' });
    const account_id = acct.account_id;
    const { group_id, movie_id, title, image, media_type: supplied_media_type } = req.body || {};
    if (!group_id || !movie_id) return res.status(400).json({ error: 'Missing data' });

    const membership = await findMember(group_id, account_id);
    if (!membership || (Number(membership.role_status) !== 1 && Number(membership.role_status) !== 2)) {
      const g = await getGroupById(group_id);
      if (!g || Number(g.account_id) !== Number(account_id)) return res.status(403).json({ error: 'Forbidden: not a member' });
    }

    try {
      // Detect media_type if not supplied
      let media_type = supplied_media_type || 'movie';
      if (!supplied_media_type) {
        try {
          await getMovieDetails(movie_id);
          media_type = 'movie';
        } catch (e1) {
          try {
            await getTvDetails(movie_id);
            media_type = 'tv';
          } catch (e2) {
            media_type = 'movie';
          }
        }
      }
      
      // Encode media_type with the ID: "tv:123" or "movie:456"
      const encoded_id = `${media_type}:${movie_id}`;
      
      const added = await addGroupMovie(group_id, encoded_id, title || null, image || null);
      res.status(201).json({ message: 'Movie added to group', movie: { ...added, media_type } });
    } catch (e) {
      if (e && e.code === '23505') return res.status(409).json({ error: 'Movie already added' });
      throw e;
    }
  } catch (err) {
    next(err);
  }
}

export async function removeMovieFromGroupHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: 'Unauthorized' });
    const account_id = acct.account_id;
    const { group_id, movie_id } = req.body || {};
    if (!group_id || !movie_id) return res.status(400).json({ error: 'Missing data' });

    const membership = await findMember(group_id, account_id);
    const g = await getGroupById(group_id);
    const isOwner = g && Number(g.account_id) === Number(account_id);
    const isMember = membership && (Number(membership.role_status) === 1 || Number(membership.role_status) === 2);
    if (!isOwner && !isMember) return res.status(403).json({ error: 'Forbidden' });

    // Try removing with the ID as-is first
    let removed = await removeGroupMovie(group_id, movie_id);
    if (!removed) {
      // Try both tv: and movie: prefixed versions
      removed = await removeGroupMovie(group_id, `tv:${movie_id}`).catch(() => null);
      if (!removed) {
        removed = await removeGroupMovie(group_id, `movie:${movie_id}`);
      }
    }
    if (!removed) return res.status(404).json({ error: 'Movie not found in group' });
    res.json({ message: 'Movie removed', removed });
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

    const existing = await findMember(group_id, account_id);
    if (existing) {
      if (existing.role_status === 3) return res.status(200).json({ message: "Request already pending" });
      return res.status(409).json({ error: "Already a member" });
    }

    const added = await addMember(group_id, account_id, 3);
    res.status(201).json({ message: "Join request created", member: added });
  } catch (err) {
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

export async function updateGroupHandler(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: "Unauthorized" });
    const account_id = acct.account_id;
    const groupId = req.params.id;
    const { group_name, name, description } = req.body || {};
    const newName = (group_name || name || "").trim();
    if (!groupId) return res.status(400).json({ error: "Missing group id" });
    if (!newName && typeof description === 'undefined') return res.status(400).json({ error: "Missing new group name or description" });

    const g = await getGroupById(groupId);
    if (!g) return res.status(404).json({ error: "Group not found" });
    if (Number(g.account_id) !== Number(account_id)) return res.status(403).json({ error: "Forbidden" });

    const updated = await updateGroupName(groupId, newName || g.group_name, typeof description === 'undefined' ? g.description : description);
    if (!updated) return res.status(500).json({ error: "Failed to update group" });
    res.json({ message: "Group updated", group: { group_id: updated.group_id, group_name: updated.group_name, description: updated.description } });
  } catch (err) {
    next(err);
  }
}
