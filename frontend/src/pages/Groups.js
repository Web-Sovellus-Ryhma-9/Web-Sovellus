import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      try {
        const res = await fetch("/api/groups");
        if (!res.ok) throw new Error("no api");
        const data = await res.json();
        if (!cancelled) setGroups(data);
      } catch (e) {
        if (!cancelled)
          setGroups([
            { id: 1, name: "Elokuvakerho", description: "Katso ja keskustele elokuvista.", image: null },
            { id: 2, name: "Sci-Fi ystävät", description: "Uusimmat scifi-elokuvat ja klassikot.", image: null },
            { id: 3, name: "Dokumentit", description: "Dokumenttielokuvien suositukset ja keskustelu.", image: null },
          ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  function joinGroup(id) {
    setJoinedIds(prev => new Set(prev).add(id));
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>Tutustu ryhmiin</h2>
          <div className="header-actions">
            <Link to="/owngroups" style={{ textDecoration: "none" }}>
              <button className="btn ghost">Omat ryhmät</button>
            </Link>
            <Link to="/creategroup" style={{ textDecoration: "none" }}>
              <button className="btn primary">Luo ryhmä</button>
            </Link>
          </div>
        </div>
        {loading ? (
          <p>Ladataan ryhmiä…</p>
        ) : (
          <div className="groups-list">
            {groups.map(group => (
              <div key={group.id} className="group-card">
                <div className="group-image">
                  {group.image ? (
                    <img src={group.image} alt={group.name} />
                  ) : (
                    <div style={{ color: "#666", fontSize: 12, textAlign: "center" }}>Kuva</div>
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
                    {joinedIds.has(group.id) ? "Odottaa hyväksymistä" : "Liity ryhmään"}
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