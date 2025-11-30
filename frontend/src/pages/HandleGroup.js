import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function HandleGroup() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [groupName, setGroupName] = useState("Group name (placeholder)");
  const [newName, setNewName] = useState("");

  // PLACEHOLDERS
  const [requests, setRequests] = useState([
    { id: "u1", username: "User1" },
    { id: "u2", username: "User2" },
    { id: "u3", username: "User3" },
  ]);

  function handleConfirmDelete() {
    setShowDeleteConfirm(false);
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

  function handleAccept(id) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }
  function handleReject(id) {
    setRequests(prev => prev.filter(r => r.id !== id));
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
              {requests.length === 0 ? (
                <p className="muted">No pending requests.</p>
              ) : (
                <ul className="request-list">
                  {requests.map((r) => (
                    <li key={r.id} className="request-item">
                      <span className="request-user">{r.username}</span>
                      <div className="request-actions">
                        <button
                          className="btn success"
                          onClick={() => handleAccept(r.id)}
                          aria-label={`Accept ${r.username}`}
                        >
                          Accept
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => handleReject(r.id)}
                          aria-label={`Reject ${r.username}`}
                        >
                          Reject
                        </button>
                      </div>
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