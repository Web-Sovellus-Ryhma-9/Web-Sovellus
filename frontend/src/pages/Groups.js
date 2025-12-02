import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState(new Set());

  const API_BASE = process.env.REACT_APP_API_URL || ""; // empty -> relative to current origin

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
        const res = await fetch(url, { headers: { Accept: "application/json" } });
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

  function joinGroup(id) {
    setJoinedIds(prev => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
  }

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
        ) : groups.length === 0 ? (
          <p>No Groups</p>
        ) : (
          <div className="groups-list">
            {groups.map(group => (
              <div key={group.id} className="group-card">
                <div className="group-image">
                  {group.image ? (
                    <img src={group.image} alt={group.name} />
                  ) : (
                    <div style={{ color: "#666", fontSize: 12, textAlign: "center" }}>Image</div>
                  )}
                </div>

                <div className="group-info">
                  <Link to={`/group/${group.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={{ margin: 0 }}>{group.name}</h3>
                  </Link>
                  <p style={{ margin: "6px 0 0", color: "#444" }}>{group.description}</p>
                </div>

                <div className="group-action">
                  <button
                    onClick={() => joinGroup(group.id)}
                    disabled={joinedIds.has(group.id)}
                    className="btn"
                    style={{
                      background: joinedIds.has(group.id) ? "#ddd" : undefined,
                      cursor: joinedIds.has(group.id) ? "default" : undefined,
                      padding: "8px 16px",
                    }}
                  >
                    {joinedIds.has(group.id) ? "Pending approval" : "Join Group"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}