import React from "react";
import Header from "../components/Header";

export default function Groups() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Ryhmät</h2>
        <p>Lista ryhmistä ja linkit yksittäisiin ryhmiin.</p>
      </div>
    </div>
  );
}
