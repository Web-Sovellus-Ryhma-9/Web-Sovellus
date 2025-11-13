import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useSearchParams } from "react-router-dom";

export default function Search() {
  // `query` state removed — we read the search term from the URL params instead
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "";
  const [searchParams] = useSearchParams();

useEffect(() => {
  const q = searchParams.get('q') || '';
  if (!q) { setResults([]); return; }

  let cancelled = false;
  (async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/tmdb/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!cancelled) setResults(json.results || []);
    } catch (err) {
      if (!cancelled) setError(err.message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [searchParams, API_BASE]);

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Search Movies</h2>

        {/* Search is provided in the header; results update from the `q` URL param. */}

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div>
          {results.length === 0 && !loading && <p>No results</p>}
          {results.map((m) => (
            <div key={m.id} style={{ display: "flex", marginBottom: 12 }}>
              {m.poster_path ? (
                <img
                  alt={m.title}
                  src={`https://image.tmdb.org/t/p/w154${m.poster_path}`}
                  style={{ width: 100, height: "auto", marginRight: 12 }}
                />
              ) : (
                <div style={{ width: 100, height: 150, background: "#ddd", marginRight: 12 }} />
              )}
              <div>
                <h3 style={{ margin: 0 }}>{m.title} <small>({m.release_date?.slice(0,4)})</small></h3>
                <p style={{ margin: "6px 0" }}>{m.overview?.slice(0,200)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
