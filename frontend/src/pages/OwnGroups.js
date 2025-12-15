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

        // Use public endpoint that returns role_status for the requesting user
        const url = `${API_BASE || ""}/groups/getGroups`;
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
        // filter groups where the requesting user is the owner or a member (role_status === 1 or 2)
        const currentAccountId = Number(JSON.parse(localStorage.getItem('account') || '{}').account_id || 0);
        const mine = (data || []).filter(g => {
          const rs = Number(g.role_status || 0);
          if (rs === 1 || rs === 2) return true;
          // fallback: include if this group was created by current user
          if (Number(g.account_id) === currentAccountId && currentAccountId > 0) return true;
          return false;
        });
        const normalized = mine.map((g) => ({
          group_id: g.group_id || g.id || g.groupId,
          group_name: g.group_name || g.name,
          description: g.description || g.desc || "",
          image: g.image || g.image_url || null,
          isOwner: Number(g.role_status || 0) === 1 || (Number(g.account_id) === currentAccountId && currentAccountId > 0),
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
        <div className="page-header">
          <h2 className="page-title">Own Groups</h2>
          <div className="header-actions">
            <Link to="/groups" className="link-unstyled">
              <button className="btn ghost">Groups</button>
            </Link>
            <Link to="/creategroup" className="link-unstyled">
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
              className="group-card own-groups-card"
            >


              <div className="group-info">
                <Link to={`/group/${g.group_id}`} className="link-unstyled">
                  <h3>{g.group_name}</h3>
                </Link>
                <p className="group-description-text">{g.description}</p>
              </div>

              <div className="group-action">
                {g.isOwner ? (
                  <button className="btn btn-large" onClick={() => handleManage(g)}>
                    Manage
                  </button>
                ) : (
                  <button className="btn btn-large" disabled>
                    Member
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}