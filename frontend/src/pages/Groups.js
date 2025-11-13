import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

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
        // No backend groups API found — fall back to mock data so browsing works locally
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
    // optimistic UI: mark as joined locally. Replace with API call when backend exists.
    setJoinedIds(prev => new Set(prev).add(id));
    // Example: fetch(`/api/groups/${id}/join`, { method: 'POST' })...
  }

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Tutustu ryhmiin</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/owngroups" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 12px",
                  borderRadius: 4,
                  border: "1px solid #bbb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Omat ryhmät
              </button>
            </Link>
            <Link to="/creategroup" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #bbb",
                  background: "#f6f6f6",
                  cursor: "pointer",
                }}
              >
                Luo ryhmä
              </button>
            </Link>
          </div>
        </div>
        {loading ? (
          <p>Ladataan ryhmiä…</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {groups.map(group => (
              <div
                key={group.id}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: 8, borderBottom: "1px solid #eee" }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    border: "2px solid #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fff",
                  }}
                >
                  {group.image ? (
                    <img src={group.image} alt={group.name} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                  ) : (
                    <div style={{ color: "#666", fontSize: 12, textAlign: "center" }}>Kuva</div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <Link to={`/group/${group.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={{ margin: 0 }}>{group.name}</h3>
                  </Link>
                  <p style={{ margin: "6px 0 0", color: "#444" }}>{group.description}</p>
                </div>

                <div style={{ width: 160, textAlign: "right" }}>
                  <button
                    onClick={() => joinGroup(group.id)}
                    disabled={joinedIds.has(group.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "1px solid #bbb",
                      background: joinedIds.has(group.id) ? "#ddd" : "#f6f6f6",
                      cursor: joinedIds.has(group.id) ? "default" : "pointer",
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
