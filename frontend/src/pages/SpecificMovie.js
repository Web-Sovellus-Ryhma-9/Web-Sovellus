import React from "react";
import Header from "../components/Header";

export default function SpecificMovie() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Elokuvan sivu</h2>
        <p>Tietoja tietystä elokuvasta (placeholder).</p>
      </div>
    </div>
  );
}
