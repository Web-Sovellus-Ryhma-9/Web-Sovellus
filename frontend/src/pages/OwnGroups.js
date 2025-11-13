import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

export default function OwnGroups() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Omat ryhmät</h2>
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
        <p>Täällä näytetään käyttäjän omat ryhmät (placeholder).</p>
      </div>
    </div>
  );
}
