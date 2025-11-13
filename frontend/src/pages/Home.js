import React, { useEffect, useState } from "react";
import Header from "../components/Header";

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
        // data.results is the TMDB list; take first 5
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
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>Tervetuloa</h1>
        <p>Tervetuloa sovellukseen. Käytä ylävalikkoa siirtyäksesi eri sivuille tai hae sisältöä hakupalkin avulla.</p>

        <h2>Now Playing</h2>

        {loading && <p>Loading movies...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {!loading && !error && (
          <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
            {movies.map((m) => (
              <div key={m.id} style={{ width: 200, flex: "0 0 auto", textAlign: "center" }}>
                {m.poster_path ? (
                  <img
                    src={`${TMDB_IMAGE}${m.poster_path}`}
                    alt={m.title}
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 300, background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>{m.title}</div>
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
