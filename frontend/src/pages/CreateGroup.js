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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Anna ryhmälle nimi.");
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

      alert("Luonti onnistui.");
      navigate("/OwnGroups"); // React Router SPA-navigointi
    } catch (err) {
      console.error("[CreateGroup] error:", err);
      setError(err.message || "Virhe tapahtui");
    } finally {
      setSubmitting(false);
    }
  };

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
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="Anna ryhmän nimi"
            />
          </label>

          <label className="label">
            Kuvaus (valinnainen)
            <textarea
              className="textarea-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
