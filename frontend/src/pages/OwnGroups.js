import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function OwnGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL || "";
  const TEST_MODE = false; // set true to use local TEST_GROUPS
  const TEST_GROUPS = [
    { group_id: 1, group_name: "Demo group 1", description: "Description 1", image: null },
    { group_id: 2, group_name: "Demo group 2", description: "Description 2", image: null },
  ];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (TEST_MODE) {
        setTimeout(() => {
          if (!cancelled) {
            setGroups(TEST_GROUPS);
            setLoading(false);
          }
        }, 300);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const headers = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const url = `${API_BASE || ""}/groups/getOwnGroups`;
        console.debug("OwnGroups: fetching", url, "hasToken:", !!token);
        const res = await fetch(url, { headers });
        console.debug("OwnGroups: response status", res.status);
        if (res.status === 401) {
          console.warn("OwnGroups: unauthorized (401)");
          if (!cancelled) setGroups([]);
          return;
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("OwnGroups: fetch failed", res.status, text);
          if (!cancelled) {
            setGroups([]);
            setError("Server error while loading own groups.");
          }
          return;
        }
        const data = await res.json();
        const normalized = (data || []).map((g) => ({
          group_id: g.group_id || g.id || g.groupId,
          group_name: g.group_name || g.name,
          description: g.description || g.desc || "",
          image: g.image || g.image_url || null,
        }));
        if (!cancelled) setGroups(normalized);
      } catch (e) {
        console.error("OwnGroups: error", e);
        if (!cancelled) {
          setGroups([]);
          setError("Error loading own groups.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  function handleManage(group) {
    if (!group || !group.group_id) return;
    navigate(`/handlegroup/${group.group_id}`);
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Own Groups</h2>
          <div className="header-actions">
            <Link to="/creategroup" style={{ textDecoration: "none" }}>
              <button className="btn primary">Create Group</button>
            </Link>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="error-text">{error}</div>}
        {!loading && groups.length === 0 && <div>No groups.</div>}

        <div className="groups-list">
          {groups.map((g) => (
            <div
              key={g.group_id}
              className="group-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 6,
                marginBottom: 10,
              }}
            >
              <div
                className="group-image"
                style={{
                  width: 80,
                  height: 60,
                  background: "#f6f6f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {g.image ? (
                  <img src={g.image} alt={g.group_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ color: "#666", fontSize: 12 }}>Kuva</div>
                )}
              </div>

              <div className="group-info" style={{ flex: 1 }}>
                <Link to={`/group/${g.group_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <h3 style={{ margin: 0 }}>{g.group_name}</h3>
                </Link>
                <p style={{ margin: "6px 0 0", color: "#444" }}>{g.description}</p>
              </div>

              <div className="group-action" style={{ marginLeft: 12 }}>
                <button className="btn" onClick={() => handleManage(g)}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}