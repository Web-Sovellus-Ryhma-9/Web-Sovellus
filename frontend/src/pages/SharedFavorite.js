import React from "react";
import Header from "../components/Header";

export default function SharedFavorite() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Shared Favorites</h2>
        <p>List of shared favorites (placeholder).</p>
      </div>
    </div>
  );
}
