import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/Groups.css";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState(new Set());

  const API_BASE = process.env.REACT_APP_API_URL || ""; // empty -> relative to current origin
  const token = localStorage.getItem("token");
  const loggedIn = Boolean(token);

  function decodeJwt(token) {
    try {
      const p = token.split(".")[1];
      if (!p) return null;
      const json = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
      return json;
    } catch (err) {
      return null;
    }
  }

  function getCurrentAccountId() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = decodeJwt(token);
    return payload ? (payload.account_id ?? payload.accountId ?? payload.id ?? null) : null;
  }

  // helpers
  function getGroupId(g) {
    return g?.group_id ?? g?.id ?? null;
  }
  function getGroupRole(g) {
    return g?.role_status ?? g?.role ?? null; // backend should provide role_status for current user
  }
  function isOwnerOrMember(g) {
    const r = getGroupRole(g);
    return r === 1 || r === 2;
  }

  async function fetchGroups(limit) {
    let cancelled = false;
    try {
      setLoading(true);
      const base = API_BASE || "";
      const attempts = [
        `${base}/groups/getGroups`,
        `${base}/groups`
      ];

      let data = null;
      for (const url of attempts) {
        console.debug("Groups: trying", url);
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch(url, { method: "GET", headers });
        if (res.ok) {
          data = await res.json();
          break;
        }
        // if 404 try next, log other non-ok statuses
        console.debug(`Groups: ${url} -> ${res.status}`);
      }

      if (!cancelled) {
        if (Array.isArray(data)) {
          const groupsList = typeof limit === "number" ? data.slice(0, limit) : data;
          // attempt to fetch owner username for each group (uses existing members endpoint)
          try {
            const token = localStorage.getItem("token");
            const memberHeaders = {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            const groupsWithOwner = await Promise.all(groupsList.map(async (g) => {
              const gid = getGroupId(g);
              try {
                const r = await fetch(`${base}/groups/members/${gid}`, { method: "GET", headers: memberHeaders });
                if (r.ok) {
                  const members = await r.json();
                  // owner is the member with role_status === 1, or fallback to group's account_id
                  const owner = members.find(m => Number(m.role_status) === 1) || members.find(m => Number(m.account_id) === Number(g.account_id));
                  return { ...g, owner_username: owner?.username ?? null };
                }
              } catch (e) {
                // ignore per-group failures; leave owner null
              }
              return { ...g, owner_username: null };
            }));

            setGroups(groupsWithOwner);
          } catch (e) {
            // if owner fetch fails entirely, fall back to raw list
            setGroups(groupsList);
          }

          // If the backend included role_status for the requesting user, populate
          // the joinedIds set with groups that are in pending state (role_status === 3).
          try {
            const pendingSet = new Set();
            const checkList = Array.isArray(data) ? data : [];
            checkList.forEach(g => {
              const rs = Number(getGroupRole(g) ?? 0);
              if (rs === 3) {
                const gid = getGroupId(g);
                if (gid != null) pendingSet.add(Number(gid));
              }
            });
            if (pendingSet.size > 0) {
              setJoinedIds(prev => {
                const s = new Set(prev);
                pendingSet.forEach(id => s.add(id));
                return s;
              });
            }
          } catch (e) {
            // defensive: don't break UI if mapping fails
            console.warn("Groups: could not derive pending ids", e);
          }
        } else {
          setGroups([]);
        }
      }
    } catch (e) {
      console.error("Groups: fetch error", e);
      if (!cancelled) {
        setGroups([]);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    let stop = false;
    // load all groups from DB; pass a number to limit if needed
    fetchGroups();
    return () => {
      stop = true;
    };
  }, []);

  async function joinGroup(id) {
    try {
      const groupObj = groups.find(g => String(getGroupId(g)) === String(id));
      const currentAccountId = getCurrentAccountId();

      // client-side guard if role is explicit
      if (groupObj && isOwnerOrMember(groupObj)) {
        alert("You are already a member/owner of this group.");
        return;
      }

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body = JSON.stringify({ group_id: id });

      // try /api first (common), then fallback to non-/api mount
      const candidates = [
        `${API_BASE}/groups/members/join`,
      ].filter(Boolean);

      let lastErr = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, { method: "POST", headers, body });
          // try to parse JSON, but fallback to text for 5xx diagnostics
          let data;
          try {
            data = await res.json();
          } catch (e) {
            data = await res.text().catch(() => ({}));
          }

          if (res.ok) {
            // success -> pending
            setJoinedIds(prev => {
              const s = new Set(prev);
              s.add(Number(id));
              return s;
            });
            return;
          }

          // handle expected client errors
          if (res.status === 400) {
            alert(data.error || data.message || "Cannot request to join this group.");
            return;
          }

          // treat 200 with message (e.g. already pending)
          if (res.status === 200) {
            alert(data.message || "Request already pending.");
            setJoinedIds(prev => {
              const s = new Set(prev);
              s.add(Number(id));
              return s;
            });
            return;
          }

          // 5xx: server error -> surface server body and stop trying fallbacks
          if (res.status >= 500) {
            const bodyText = typeof data === "string" ? data : JSON.stringify(data);
            console.error("[Groups] server 5xx on", url, bodyText);
            alert("Server error while requesting join:\n" + (bodyText || `HTTP ${res.status}`));
            return;
          }

          // other statuses -> try next candidate (store last)
          lastErr = new Error(data.error || data.message || `HTTP ${res.status}`);
        } catch (err) {
          lastErr = err;
          console.warn("[Groups] join attempt failed for", url, err);
          // try next candidate
        }
      }

      // all attempts failed
      console.error("[Groups] all join endpoints failed:", lastErr);
      alert(lastErr?.message || "Failed to request join (server error).");
    } catch (err) {
      console.error("[Groups] joinGroup error:", err);
      alert(err.message || "Failed to request join");
    }
  }

  // Show all groups. Frontend will decide action buttons per group based on role_status
  const displayGroups = groups;

  return (
    <div>
      <Header />
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">Explore Groups</h2>
          <div className="header-actions">
            <Link to="/owngroups" className="link-unstyled">
              <button className="btn ghost btn-large">My Groups</button>
            </Link>
            <Link to="/creategroup" className="link-unstyled">
              <button className="btn primary btn-large">Create Group</button>
            </Link>
          </div>
        </div>
        {loading ? (
          <p>Loading groups…</p>
        ) : displayGroups.length === 0 ? (
          <p>No groups found</p>
        ) : (
          <div className="groups-list">
            {displayGroups.map(group => {
              const gid = getGroupId(group);
              const role = getGroupRole(group);
              // pending if client set (joinedIds) or backend indicates pending via role_status === 3
              const pending = joinedIds.has(Number(gid)) || Number(role) === 3;

              return (
                <div key={gid} className="group-card">
                  <div className="group-image">
                    {group.image ? (
                      <img src={group.image} alt={group.name} />
                    ) : (
                      <div className="group-image-placeholder">Image</div>
                    )}
                  </div>

                  <div className="group-info">
                    <Link
                      to={`/group/${gid}`}
                      className="link-unstyled"
                    >
                      <h3>{group.name}</h3>
                    </Link>
                    {group.owner_username ? (
                      <p className="group-owner-text">
                        Owner: {group.owner_username}
                      </p>
                    ) : null}
                    <p className="group-description-text">{group.description}</p>
                  </div>

                  <div className="group-action">
                    {role === 1 ? (
                      <Link to={`/handlegroup/${gid}`} className="link-unstyled">
                        <button className="btn btn-large">Manage</button>
                      </Link>
                    ) : role === 2 ? (
                      <button className="btn btn-large" disabled>
                        Member
                      </button>
                    ) : !loggedIn ? (
                      <Link to="/login" className="link-unstyled">
                        <button className="btn btn-large">Login to Join</button>
                      </Link>
                    ) : pending ? (
                      <button className="btn btn-large" disabled>
                        Pending request
                      </button>
                    ) : (
                      <button
                        onClick={() => joinGroup(gid)}
                        className="btn btn-large"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}