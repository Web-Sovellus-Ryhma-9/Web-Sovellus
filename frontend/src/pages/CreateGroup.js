import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("You must give a group name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const API = process.env.REACT_APP_API_URL || "";
      const token = localStorage.getItem("token");
      const body = { group_name: name.trim(), description: description.trim() };

      const res = await fetch(`${API}/groups/creategroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }

      setModalContent({ title: "Group Created", message: "Creation successful. Redirecting to your groups." });
      setShowModal(true);
      setTimeout(() => navigate("/OwnGroups"), 1200);
    } catch (err) {
      console.error("[CreateGroup] error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>Create Group</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="label">
            Group name
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="Enter group name"
            />
          </label>

          <label className="label">
            Description (optional)
            <textarea
              className="textarea-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Short description of the group"
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              className={`btn primary ${submitting ? "disabled" : ""}`}
            >
              {submitting ? "Creating…" : "Create Group"}
            </button>

            <button type="button" onClick={() => navigate(-1)} className="btn">
              Cancel
            </button>
          </div>

          <small className="small-note">
            Note: if the server is not available, the group will be saved locally in your browser (demo only).
          </small>
        </form>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-title">{modalContent.title}</h3>
            <p>{modalContent.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
