import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

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
        // If backend returns the created resource, navigate to it. Otherwise go to own groups.
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
      // Backend not available or POST failed — persist locally so the UI remains usable.
      const local = { id: `local-${Date.now()}`, name: name.trim(), description: description.trim() };
      const existing = JSON.parse(localStorage.getItem("localGroups") || "[]");
      localStorage.setItem("localGroups", JSON.stringify([local, ...existing]));
      // Navigate to own groups where the app can display user-created groups (you can read localGroups there)
      navigate("/owngroups");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Luo ryhmä</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 600 }}>
          <label style={{ fontSize: 14 }}>
            Ryhmän nimi
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={submitting}
              placeholder="Anna ryhmän nimi"
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>

          <label style={{ fontSize: 14 }}>
            Kuvaus (valinnainen)
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Lyhyt kuvaus ryhmästä"
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6, minHeight: 80 }}
            />
          </label>

          {error && <div style={{ color: "#b00020" }}>{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "8px 16px", borderRadius: 4, border: "1px solid #bbb", cursor: submitting ? "default" : "pointer" }}
            >
              {submitting ? "Luodaan…" : "Luo ryhmä"}
            </button>

            <button type="button" onClick={() => navigate(-1)} style={{ padding: "8px 12px" }}>
              Peruuta
            </button>
          </div>

          <small style={{ color: "#666" }}>
            Huom: jos palvelin ei ole käytettävissä, ryhmä tallennetaan paikallisesti selaimeesi (vain demo).
          </small>
        </form>
      </div>
    </div>
  );
}
