import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w300";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:3001/tmdb/now_playing?page=1&region=FI");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setMovies((data.results || []).slice(0, 5));
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
  }, []);

  return (
    <div>
      <Header />
      <div className="home-container">
        <h1>Tervetuloa</h1>
        <p>Tervetuloa sovellukseen. Käytä ylävalikkoa siirtyäksesi eri sivuille tai hae sisältöä hakupalkin avulla.</p>

        <h2>Now Playing</h2>

        {loading && <p>Loading movies...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {!loading && !error && (
          <div className="movie-row">
            {movies.map((m) => (
              <div key={m.id} className="movie-card">
                {m.poster_path ? (
                  <img
                    className="movie-poster"
                    src={`${TMDB_IMAGE}${m.poster_path}`}
                    alt={m.title}
                  />
                ) : (
                  <div className="movie-placeholder">{m.title}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <strong>{m.title}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>{"Premiere: "}{m.release_date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}