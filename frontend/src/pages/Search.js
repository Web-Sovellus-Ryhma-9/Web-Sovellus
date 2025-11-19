import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./styles/pagestyles.css";

export default function Search() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [yearFrom, setYearFrom] = useState(String(2000));
  const [yearTo, setYearTo] = useState(String(new Date().getFullYear()));
  const [genre, setGenre] = useState("");
  const [genresList, setGenresList] = useState([]);
  const [searchBy, setSearchBy] = useState('title'); // 'title' or 'person'

  // load available genres from backend
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/tmdb/genres`);
        if (!res.ok) return;
        const json = await res.json();
        if (!canceled && json.genres) setGenresList(json.genres);
      } catch (e) {
        // ignore
      }
    })();
    return () => { canceled = true; };
  }, [API_BASE]);

  // initialize filters from query params
  useEffect(() => {
    const yf = searchParams.get("year_from") || searchParams.get("yearFrom");
    const yt = searchParams.get("year_to") || searchParams.get("yearTo");
    const g = searchParams.get("with_genres") || searchParams.get("genre");
    const sb = searchParams.get('search_by') || 'title';
    if (yf !== null) setYearFrom(String(yf));
    if (yt !== null) setYearTo(String(yt));
    if (g) setGenre(g);
    if (sb) setSearchBy(sb);
  }, [searchParams]);

  // persist filters to URL and localStorage when they change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const params = {};
    if (q) params.q = q;
    // preserve search_by when set (so changing filters doesn't drop person search)
    const sb = searchParams.get('search_by') || (searchBy || 'title');
    if (sb && sb !== 'title') params.search_by = sb;
    // sanitize years (remove leading zeros and invalid values)
    const yfNum = yearFrom ? parseInt(yearFrom, 10) : NaN;
    const ytNum = yearTo ? parseInt(yearTo, 10) : NaN;
    if (!isNaN(yfNum)) params.year_from = String(yfNum);
    if (!isNaN(ytNum)) params.year_to = String(ytNum);
    if (genre) params.with_genres = genre;
    setSearchParams(params, { replace: true });

    // store for Header to reuse
    try {
      const store = {};
      if (!isNaN(yfNum)) store.year_from = String(yfNum);
      if (!isNaN(ytNum)) store.year_to = String(ytNum);
      if (genre) store.with_genres = genre;
      localStorage.setItem("tmdb_filters", JSON.stringify(store));
    } catch (e) {}
  }, [yearFrom, yearTo, genre]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const yfRaw = searchParams.get('year_from') || searchParams.get('yearFrom') || '';
    const ytRaw = searchParams.get('year_to') || searchParams.get('yearTo') || '';
    const g = searchParams.get('with_genres') || searchParams.get('genre') || '';
    const sb = searchParams.get('search_by') || 'title';

    const yf = yfRaw ? parseInt(yfRaw, 10) : null;
    const yt = ytRaw ? parseInt(ytRaw, 10) : null;

    // always fetch: let backend decide (discover when no textual query)

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (!isNaN(yf) && yf !== null) params.append('year_from', String(yf));
        if (!isNaN(yt) && yt !== null) params.append('year_to', String(yt));
        if (g) params.append('with_genres', g);
        params.append('page', '1');
        const paramString = params.toString();
        const url = (sb === 'person')
          ? `${API_BASE}/tmdb/person_movies?${paramString}`
          : (paramString ? `${API_BASE}/tmdb/search?${paramString}` : `${API_BASE}/tmdb/search`);
        // debug log
        console.log('Fetching TMDB with URL:', url);
        const res = await fetch(url);
        const json = await res.json();
        if (!cancelled) {
          // person_movies now proxies discover and returns a search/discover-style response
          setResults(json.results || []);
          setPage(json.page || 1);
          setTotalPages(json.total_pages || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, API_BASE]);

  async function loadMore() {
    if (loading) return;
    if (totalPages && page >= totalPages) return;
    const next = page + 1;
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const yfRaw = searchParams.get('year_from') || searchParams.get('yearFrom') || '';
      const ytRaw = searchParams.get('year_to') || searchParams.get('yearTo') || '';
      const g = searchParams.get('with_genres') || searchParams.get('genre') || '';
      const yf = yfRaw ? parseInt(yfRaw, 10) : null;
      const yt = ytRaw ? parseInt(ytRaw, 10) : null;

      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (!isNaN(yf) && yf !== null) params.append('year_from', String(yf));
      if (!isNaN(yt) && yt !== null) params.append('year_to', String(yt));
      if (g) params.append('with_genres', g);
      params.append('page', String(next));
      const sb = searchParams.get('search_by') || 'title';
      const url = (sb === 'person')
        ? `${API_BASE}/tmdb/person_movies?${params.toString()}`
        : `${API_BASE}/tmdb/search?${params.toString()}`;
      console.log('Fetching next page TMDB with URL:', url);
      const res = await fetch(url);
      const json = await res.json();
      setResults((prev) => [...prev, ...(json.results || [])]);
      setPage(next);
      setTotalPages(json.total_pages || totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>Search Movies</h2>

        <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label>Year from: 
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value.replace(/\D/g, '').slice(0,4))}
              style={{ width: 100 }}
            />
          </label>
          <label>Year to: 
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value.replace(/\D/g, '').slice(0,4))}
              style={{ width: 100 }}
            />
          </label>
          <label>Genre:
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">Any</option>
              {genresList.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div className="search-results">
          {results.length === 0 && !loading && <p>No results</p>}
          {results.map((m) => (
            <div
              key={m.id}
              className="search-result"
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/movie/${m.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movie/${m.id}`); }}
            
            >
              {m.poster_path ? (
                <img
                  alt={m.title}
                  src={`https://image.tmdb.org/t/p/w154${m.poster_path}`}
                  className="result-poster"
                />
              ) : (
                <div className="result-placeholder" />
              )}
              <div className="result-info">
                <h3 style={{ margin: 0 }}>{m.title} <small>({m.release_date?.slice(0,4)})</small></h3>
                <p style={{ margin: "6px 0" }}>{m.overview?.slice(0,200)}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {loading && <div>Loading more...</div>}
          {!loading && results.length > 0 && (totalPages === null || page < totalPages) && (
            <button className="load-more" onClick={loadMore}>Load more</button>
          )}
          {!loading && totalPages !== null && page >= totalPages && (
            <div style={{ color: '#666', marginTop: 8 }}>No more results</div>
          )}
        </div>
      </div>
    </div>
  );
}