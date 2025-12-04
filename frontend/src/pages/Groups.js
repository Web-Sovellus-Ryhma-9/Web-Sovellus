import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState(new Set());

  const API_BASE = process.env.REACT_APP_API_URL || ""; // empty -> relative to current origin

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
          setGroups(typeof limit === "number" ? data.slice(0, limit) : data);
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

  // new: show only groups where user is NOT owner/member (role !== 1 && role !== 2)
  const filteredGroups = groups.filter(g => {
    const r = getGroupRole(g);
    return r !== 1 && r !== 2;
  });

  // if there are no groups to join, fall back to showing all groups so user still sees created groups
  const displayGroups = filteredGroups.length > 0 ? filteredGroups : groups;

  return (
    <div>
      <Header />
      <div className="page-container">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>Explore Groups</h2>
          <div className="header-actions">
            <Link to="/owngroups" style={{ textDecoration: "none" }}>
              <button className="btn ghost">My Groups</button>
            </Link>
            <Link to="/creategroup" style={{ textDecoration: "none" }}>
              <button className="btn primary">Create Group</button>
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
              const pending = joinedIds.has(Number(gid));

              return (
                <div key={gid} className="group-card">
                  <div className="group-image">
                    {group.image ? (
                      <img src={group.image} alt={group.name} />
                    ) : (
                      <div style={{ color: "#666", fontSize: 12, textAlign: "center" }}>Image</div>
                    )}
                  </div>

                  <div className="group-info">
                    <Link to={`/group/${gid}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h3 style={{ margin: 0 }}>{group.name}</h3>
                    </Link>
                    <p style={{ margin: "6px 0 0", color: "#444" }}>{group.description}</p>
                  </div>

                  <div className="group-action">
                    {pending ? (
                      <button className="btn" disabled style={{ background: "#ddd", padding: "8px 16px" }}>
                        Pending approval
                      </button>
                    ) : (
                      <button
                        onClick={() => joinGroup(gid)}
                        className="btn"
                        style={{ padding: "8px 16px" }}
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