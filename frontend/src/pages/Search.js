import React from "react";
import Header from "../components/Header";

export default function Search() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Search</h2>
        <p>Täällä näytetään hakutulokset (placeholder).</p>
      </div>
    </div>
  );
}
