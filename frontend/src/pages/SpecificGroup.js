import React from "react";
import Header from "../components/Header";

export default function SpecificGroup() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Ryhmän sivu</h2>
        <p>Täällä näytetään tietyn ryhmän tiedot (placeholder).</p>
      </div>
    </div>
  );
}
