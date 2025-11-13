import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || "";

  function onSubmit(e) {
    e.preventDefault();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // debounce
    if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const url = `${API_BASE}/tmdb/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
            // DEBUG: log results returned from backend/TMDB to inspect fields
            console.log('TMDB search results for', query, json.results);
        const top = (json.results || []).slice(0, 5);
        setSuggestions(top);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, API_BASE]);

  function onSelectSuggestion(title) {
    navigate(`/search?q=${encodeURIComponent(title)}`);
    setShowSuggestions(false);
    setQuery(title);
  }

  return (
    <header className="app-header" ref={wrapperRef}>
      <div className="header-left">
        <button className="logo-button" onClick={() => navigate('/')}>Home</button>
      </div>

      <form className="search-form" onSubmit={onSubmit} role="search" autoComplete="off">
        <div style={{ display: "flex", alignItems: "center", width: '100%' }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              className="search-input"
              type="search"
              placeholder="Hae..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Haku"
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              style={{ width: '100%' }}
            />
            {showSuggestions && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "white",
                border: "1px solid #ccc",
                zIndex: 50,
                maxHeight: 300,
                overflowY: "auto"
              }}>
              {loadingSuggestions && <div style={{ padding: 8 }}>Loading...</div>}
              {!loadingSuggestions && suggestions.length === 0 && (
                <div style={{ padding: 8, color: '#666' }}>No suggestions</div>
              )}
              {!loadingSuggestions && suggestions.map((s) => {
                const primaryTitle = s.title || s.name || s.original_title || s.original_name || s.media_type || `#${s.id}`;
                const year = s.release_date?.slice(0,4) || s.first_air_date?.slice(0,4) || '';
                return (
                <div
                  key={s.id}
                  onClick={() => onSelectSuggestion(primaryTitle)}
                  style={{ padding: 8, cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  {s.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                      alt={primaryTitle}
                      style={{ width: 50, height: 75, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    <div style={{ width: 50, height: 75, background: '#ddd', borderRadius: 4 }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ lineHeight: 1, fontSize: 18, color: '#000000ff' }}>{primaryTitle}</strong>                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
          <button className="search-button" type="submit" aria-label="Hae" style={{ marginLeft: 8 }}>Hae</button>
        </div>
      </form>

      <nav className="header-right" aria-label="Päävalikko">
        <button className="nav-button" onClick={() => (window.location.href = "/groups")}>Ryhmät</button>
        <button className="nav-button" onClick={() => (window.location.href = "/login")}>Kirjaudu</button>
      </nav>
    </header>
  );
}

export default Header;
