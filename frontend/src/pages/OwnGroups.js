import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function OwnGroups() {
  return (
    <div>
      <Header />
      <div className="page-container">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>Omat ryhmät</h2>
          <Link to="/creategroup" style={{ textDecoration: "none" }}>
            <button className="btn primary">Luo ryhmä</button>
          </Link>
        </div>
        <p>Täällä näytetään käyttäjän omat ryhmät (placeholder).</p>
      </div>
    </div>
  );
}