import React from "react";
import Header from "../components/Header";

export default function Home() {
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>Tervetuloa</h1>
        <p>Tervetuloa sovellukseen. Käytä ylävalikkoa siirtyäksesi eri sivuille tai hae sisältöä hakupalkin avulla.</p>
      </div>
    </div>
  );
}
