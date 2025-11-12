import React from "react";
import Header from "../components/Header";

export default function Profile() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Profiili</h2>
        <p>Käyttäjän profiilitiedot (placeholder).</p>
      </div>
    </div>
  );
}
