import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function SpecificGroup() {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { id: groupId } = useParams();

  const [members, setMembers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [groupName, setGroupName] = useState("Group Name (placeholder)");
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  

  const API_BASE = process.env.REACT_APP_API_URL || "";

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

      // load movies from localStorage
      try {
        const key = `groupMovies:${groupId}`;
        const gm = JSON.parse(localStorage.getItem(key) || '[]');
        if (!cancelled) setMovies(Array.isArray(gm) ? gm : []);
      } catch (e) {
        setMovies([]);
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
    // Leave group: remove from group_members via API if logged in, otherwise local fallback
    setShowLeaveConfirm(false);
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

        {/* Movies section */}
        <div className="group-movies-section">
          <label className="section-label">Group Movies</label>
          <div id="group-movies-grid" className="group-movie-grid">
            {movies.length === 0 ? (
              <div style={{ color: '#666' }}>No movies yet.</div>
            ) : (
              movies.map(m => (
                <Link key={m.id} to={`/movie/${m.id}`} className="group-movie-link">
                  <div className="group-movie-card">
                    <div className="group-movie-image">
                      {m.image ? <img src={m.image} alt={m.title} /> : <div className="group-movie-placeholder">Image</div>}
                    </div>
                    <div className="group-movie-name">{m.title}</div>
                  </div>
                </Link>
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
                    <span style={{ marginLeft: 8, color: '#666' }}>{m.role_status === 1 ? 'Owner' : (m.role_status === 2 ? 'Member' : m.role_status === 3 ? 'Pending' : '')}</span>
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
              <h3 id="leave-group-title">Leave Group</h3>
              <p>Are you sure you want to leave the group?</p>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
                <button className="btn danger" onClick={handleConfirmLeave}>Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}