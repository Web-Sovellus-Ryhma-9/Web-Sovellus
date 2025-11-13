import React from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";

export default function SpecificGroup() {
  const placeholderMovies = [
    { id: 1, title: "Elokuva 1", image: null },
    { id: 2, title: "Elokuva 2", image: null },
    { id: 3, title: "Elokuva 3", image: null },
    { id: 4, title: "Elokuva 4", image: null },
    { id: 5, title: "Elokuva 5", image: null },
    { id: 6, title: "Elokuva 6", image: null },
  ];

  return (
    <div>
      <Header />
      <div className="page-container group-page">
        <h2 className="group-title">Ryhmän nimi (placeholder)</h2>

        <div className="group-movies-section">
          <label className="section-label" htmlFor="group-movies-grid">
            Ryhmän elokuvat
          </label>

          <div id="group-movies-grid" className="group-movie-grid">
            {placeholderMovies.map((m) => (
              <div key={m.id} className="group-movie-card">
                <div className="group-movie-image">
                  {m.image ? (
                    <img src={m.image} alt={m.title} />
                  ) : (
                    <div className="group-movie-placeholder">Kuva</div>
                  )}
                </div>
                <div className="group-movie-name">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}