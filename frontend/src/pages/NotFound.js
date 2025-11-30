import React from "react";
import Header from "../components/Header";

export default function NotFound() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>ERROR 404</h2>
        <p>Page not found.</p>
      </div>
    </div>
  );
}
