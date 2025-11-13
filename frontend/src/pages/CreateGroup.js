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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Anna ryhmälle nimi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.id) {
          navigate(`/group/${data.id}`);
        } else {
          navigate("/owngroups");
        }
        return;
      }

      throw new Error("server error");
    } catch (e) {
      const local = { id: `local-${Date.now()}`, name: name.trim(), description: description.trim() };
      const existing = JSON.parse(localStorage.getItem("localGroups") || "[]");
      localStorage.setItem("localGroups", JSON.stringify([local, ...existing]));
      navigate("/owngroups");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>Luo ryhmä</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="label">
            Ryhmän nimi
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={submitting}
              placeholder="Anna ryhmän nimi"
            />
          </label>

          <label className="label">
            Kuvaus (valinnainen)
            <textarea
              className="textarea-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Lyhyt kuvaus ryhmästä"
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              className={`btn primary ${submitting ? "disabled" : ""}`}
            >
              {submitting ? "Luodaan…" : "Luo ryhmä"}
            </button>

            <button type="button" onClick={() => navigate(-1)} className="btn">
              Peruuta
            </button>
          </div>

          <small className="small-note">
            Huom: jos palvelin ei ole käytettävissä, ryhmä tallennetaan paikallisesti selaimeesi (vain demo).
          </small>
        </form>
      </div>
    </div>
  );
}
