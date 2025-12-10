import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/SpecificGroup.css";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function SpecificGroup() {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { id: groupId } = useParams();

  const [members, setMembers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [groupName, setGroupName] = useState("Group Name (placeholder)");
  const [groupDescription, setGroupDescription] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  

  const API_BASE = process.env.REACT_APP_API_URL || "";

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
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = decodeJwt(token);
    return payload ? (payload.account_id ?? payload.accountId ?? payload.id ?? null) : null;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // fetch basic groups and find this group's name (include auth so role_status is available)
        const token = localStorage.getItem('token');
        const greq = await fetch(`${API_BASE}/groups/getGroups`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (greq.ok) {
          const gjson = await greq.json();
          const g = (gjson || []).find(x => String(x.group_id) === String(groupId) || String(x.id) === String(groupId));
          if (g && !cancelled) {
            setGroupName(g.name || g.group_name || g.groupName || g.group_name);
            setGroupDescription(g.description || "");
            setIsOwner(Number(g.role_status) === 1);
            setIsMember(Number(g.role_status) === 2 || Number(g.role_status) === 1);
          }
        }
      } catch (e) {
        // ignore
      }

      // fetch members
      try {
        const token2 = localStorage.getItem('token');
        const mres = await fetch(`${API_BASE}/groups/members/${groupId}`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {} });
        if (mres.ok) {
          const mrows = await mres.json();
          if (!cancelled) setMembers(Array.isArray(mrows) ? mrows : []);
        }
      } catch (e) {
        // ignore
      }

      // load movies from server; fall back to localStorage
      try {
        const mres2 = await fetch(`${API_BASE}/groups/movies/${groupId}`);
        if (mres2.ok) {
          const mv = await mres2.json();
          if (!cancelled) setMovies(Array.isArray(mv) ? mv : []);
        } else {
          const key = `groupMovies:${groupId}`;
          const gm = JSON.parse(localStorage.getItem(key) || '[]');
          if (!cancelled) setMovies(Array.isArray(gm) ? gm : []);
        }
      } catch (e) {
        try {
          const key = `groupMovies:${groupId}`;
          const gm = JSON.parse(localStorage.getItem(key) || '[]');
          if (!cancelled) setMovies(Array.isArray(gm) ? gm : []);
        } catch (ee) {
          if (!cancelled) setMovies([]);
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    if (!loading) {
      // only allow access if user is a member or owner
      if (!isMember) {
        // redirect to groups listing
        navigate('/groups');
      }
    }
  }, [loading, isMember, navigate]);

  function handleConfirmLeave() {
    setShowLeaveConfirm(true);
  }

  async function confirmLeave() {
    try {
      // owner cannot leave
      if (isOwner) {
        // keep modal open to show owner message (handled in render)
        return;
      }

      const token = localStorage.getItem('token');
      const accountId = getCurrentAccountId();
      if (!token || !accountId) {
        // not logged in: just close modal and navigate away
        setShowLeaveConfirm(false);
        navigate('/groups');
        return;
      }

      const url = `${API_BASE}/groups/members/${accountId}`;
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || `Failed to leave group (status ${res.status})`);
        return;
      }
      // success -> navigate back to groups list
      setShowLeaveConfirm(false);
      navigate('/groups');
    } catch (err) {
      console.error('[SpecificGroup] leave error', err);
      alert('Network error while leaving group');
    }
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="page-container">
          <p>Loading group…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="page-container group-page">
        <h2 className="group-title">{groupName}</h2>
        {groupDescription ? (
          <p className="group-description">{groupDescription}</p>
        ) : null}
        {/* Movies section */}
        <div className="group-movies-section">
          <label className="section-label">Group Movies</label>
          <div id="group-movies-grid" className="group-movie-grid">
            {movies.length === 0 ? (
              <div className="group-empty-text">No movies yet.</div>
            ) : (
              movies.map(m => (
                <div key={m.id} className="group-movie-item">
                  <Link to={`/${m.mediaType || m.media_type || 'movie'}/${m.id}`} className="group-movie-link">
                    <div className="group-movie-card">
                      <div className="group-movie-image">
                        {m.image ? (
                          <img
                            className="group-movie-poster"
                            src={m.image}
                            alt={m.title}
                          />
                        ) : (
                          <div className="group-movie-placeholder">No image</div>
                        )}
                      </div>
                      <div className="group-movie-name">{m.title}</div>
                    </div>
                  </Link>
                  <div className="group-movie-actions">
                    <button
                      className="btn danger"
                      onClick={async (e) => {
                        e.preventDefault();
                        // confirm deletion
                        const ok = window.confirm(`Remove "${m.title}" from this group?`);
                        if (!ok) return;
                        try {
                          // try server delete first (requires auth)
                          const token = localStorage.getItem('token');
                          if (token) {
                            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
                            const res = await fetch(`${API_BASE}/groups/movies/remove`, { method: 'POST', headers, body: JSON.stringify({ group_id: groupId, movie_id: String(m.id || m.movie_id) }) });
                            if (res.ok) {
                              // remove locally too
                              const updated = (movies || []).filter(x => String(x.id || x.movie_id) !== String(m.id || m.movie_id));
                              setMovies(updated);
                              return;
                            }
                            // if server delete failed due to auth or not found, fall back to local removal
                          }

                          // localStorage fallback
                          const key = `groupMovies:${groupId}`;
                          const curr = JSON.parse(localStorage.getItem(key) || '[]');
                          const updated = Array.isArray(curr) ? curr.filter(x => String(x.id) !== String(m.id)) : [];
                          localStorage.setItem(key, JSON.stringify(updated));
                          setMovies(updated);
                        } catch (err) {
                          console.error('[SpecificGroup] remove movie error', err);
                          alert('Failed to remove movie');
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members + actions */}
        <div className="group-members-section">
          <label className="section-label">Group Members</label>
          <div className="members-actions-row">
            <ul id="group-members-list" className="member-list">
              {members.length === 0 ? (
                <li className="member-item muted">No members yet.</li>
              ) : (
                members.map(m => (
                  <li key={m.member_id ?? m.account_id} className="member-item">
                    <div className="member-avatar">👤</div>
                    <span className="member-name">{m.username || m.account_id}</span>
                    <span className="member-role-label">
                      {m.role_status === 1
                        ? 'Owner'
                        : (m.role_status === 2
                          ? 'Member'
                          : m.role_status === 3
                            ? 'Pending'
                            : '')}
                    </span>
                  </li>
                ))
              )}
            </ul>

            <div className="group-actions">
              <button className="btn" onClick={() => setShowLeaveConfirm(true)}>Leave Group</button>
              {isOwner && (
                <Link to={`/handlegroup/${groupId}`}>
                  <button className="btn">Manage Group</button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {showLeaveConfirm && (
          <div
            className="modal-overlay"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-group-title"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwner ? (
                <>
                  <h3 id="leave-group-title">Cannot Leave Group</h3>
                  <p>You cannot leave the group as a owner.</p>
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setShowLeaveConfirm(false)}>OK</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 id="leave-group-title">Leave Group</h3>
                  <p>Are you sure you want to leave the group?</p>
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
                    <button className="btn danger" onClick={confirmLeave}>Leave</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}