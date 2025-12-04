import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import { useParams, useNavigate } from "react-router-dom";

export default function HandleGroup() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [groupName, setGroupName] = useState("Group name (placeholder)");
  const [newName, setNewName] = useState("");
  const [members, setMembers] = useState([]);
  const params = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const groupId = params.groupId || params.id;
        if (!groupId) return;

        const url = `${API_BASE}/groups/getGroups`;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(url, { method: "GET", headers });
        if (!res.ok) {
          console.warn("[HandleGroup] failed to fetch groups", res.status);
          return;
        }
        const groups = await res.json().catch(() => []);
        const g = (groups || []).find(gr => String(gr.id) === String(groupId) || String(gr.group_id) === String(groupId));
        if (g && g.name) {
          setGroupName(g.name);
        } else if (g && g.group_name) {
          setGroupName(g.group_name);
        }

        // fetch members for this group
        try {
          const membersUrl = `${API_BASE}/groups/members/${groupId}`;
          const mres = await fetch(membersUrl, { method: "GET", headers });
          if (mres.ok) {
            const mrows = await mres.json().catch(() => []);
            // backend returns rows with account_id, username, role_status, member_id
            setMembers(Array.isArray(mrows) ? mrows : []);
          } else {
            console.warn("[HandleGroup] failed to fetch members", mres.status);
          }
        } catch (e) {
          console.error("[HandleGroup] error fetching members:", e);
        }
      } catch (err) {
        console.error("[HandleGroup] error fetching group name:", err);
      }
    })();
  }, [API_BASE, params.groupId, params.id]);

  function handleConfirmDelete() {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const groupId = params.groupId || params.id;
        if (!groupId) {
          alert("Missing group id — cannot delete");
          setShowDeleteConfirm(false);
          return;
        }

        const url = `${API_BASE}/groups/delete/${groupId}`;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(url, { method: "DELETE", headers });
        if (res.ok) {
          setShowDeleteConfirm(false);
          navigate("/groups");
          return;
        }

        const body = await res.json().catch(() => ({}));
        alert(body.error || `Failed to delete group (status ${res.status})`);
      } catch (err) {
        console.error(err);
        alert("Network error while deleting group");
      }
    })();
  }

  async function handleAccept(member) {
    try {
      const token = localStorage.getItem("token");
      const groupId = params.groupId || params.id;
      if (!groupId || !member) return;
      const url = `${API_BASE}/groups/members/approve`;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body = JSON.stringify({ group_id: Number(groupId), account_id: Number(member.account_id) });
      const res = await fetch(url, { method: "POST", headers, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || data.message || `Failed to approve (status ${res.status})`);
        return;
      }
      // update local member role_status -> 2
      setMembers(prev => prev.map(m => (m.account_id === member.account_id ? { ...m, role_status: 2 } : m)));
    } catch (err) {
      console.error("[HandleGroup] approve error:", err);
      alert("Network error while approving member");
    }
  }

  async function handleReject(member) {
    // remove from UI immediately
    setMembers(prev => prev.filter(m => m.account_id !== member.account_id));
    // try to delete on server if a delete endpoint exists (best-effort)
    try {
      const token = localStorage.getItem("token");
      const groupId = params.groupId || params.id;
      if (!groupId || !member) return;
      // try DELETE by member_id (if backend exposes it)
      const deleteUrl = `${API_BASE}/groups/members/${member.member_id || member.account_id}`;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(deleteUrl, { method: "DELETE", headers }).catch(() => null);
    } catch (e) {
      // ignore
    }
  }

  function handleOpenRename() {
    setNewName(groupName);
    setShowRename(true);
  }

  function handleSaveRename(e) {
    e?.preventDefault();
    const value = (newName || "").trim();
    if (!value) return;
    setGroupName(value);
    setShowRename(false);
  }

  return (
    <div>
      <Header />
      <div id="handle-group-page" className="page-container">
        <div className="handle-group-layout">
          <aside className="handle-group-sidebar">
            <h2 className="group-title">{groupName}</h2>
            <div className="handle-actions">
              <button
                className="btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Group
              </button>
              <button className="btn" onClick={handleOpenRename}>
                Rename Group
              </button>
            </div>
          </aside>

          <section className="handle-group-main">
            <div className="requests-section">
              <h3 className="requests-header">Pending Requests</h3>
              {members.filter(m => m.role_status === 3).length === 0 ? (
                <p className="muted">No pending requests.</p>
              ) : (
                <ul className="request-list">
                  {members.filter(m => m.role_status === 3).map((r) => (
                    <li key={r.member_id ?? r.account_id} className="request-item">
                      <span className="request-user">{r.username ?? r.account_id}</span>
                      <div className="request-actions">
                        <button
                          className="btn success"
                          onClick={() => handleAccept(r)}
                          aria-label={`Accept ${r.username ?? r.account_id}`}
                        >
                          Accept
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => handleReject(r)}
                          aria-label={`Reject ${r.username ?? r.account_id}`}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="members-section" style={{ marginTop: 24 }}>
              <h3 className="requests-header">Group Members</h3>
              {members.filter(m => m.role_status === 1 || m.role_status === 2).length === 0 ? (
                <p className="muted">No members yet.</p>
              ) : (
                <ul className="request-list">
                  {members.filter(m => m.role_status === 1 || m.role_status === 2).map((m) => (
                    <li key={m.member_id ?? m.account_id} className="request-item">
                      <span className="request-user">{m.username ?? m.account_id}</span>
                      <span style={{ marginLeft: 8, color: "#666" }}>{m.role_status === 1 ? "Owner" : "Member"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-group-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-group-title">Delete Group</h3>
            <p>Are you sure you want to delete the group? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleConfirmDelete}>
                Poista
              </button>
            </div>
          </div>
        </div>
      )}

      {showRename && (
        <div
          className="modal-overlay"
          onClick={() => setShowRename(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-group-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="rename-group-title">Rename Group</h3>
            <form className="form-grid" onSubmit={handleSaveRename}>
              <label className="label" htmlFor="rename-group-input">
                Group Name
                <input
                  id="rename-group-input"
                  className="input-field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new group name"
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowRename(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={!newName.trim()}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}