import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Header.css";

function Header() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState('title'); // 'title' or 'person'
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [account, setAccount] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || "";

  function onSubmit(e) {
    e.preventDefault();
    // allow submitting empty query — include saved filters if present
    let searchPath = "/search";
    try {
      const raw = localStorage.getItem('tmdb_filters');
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (searchType && searchType !== 'title') params.append('search_by', searchType);
      if (raw) {
        const f = JSON.parse(raw);
        if (f.year_from) params.append('year_from', f.year_from);
        if (f.year_to) params.append('year_to', f.year_to);
        if (f.with_genres) params.append('with_genres', f.with_genres);
      }
      const qs = params.toString();
      if (qs) searchPath = `/search?${qs}`;
    } catch (e) {}
    navigate(searchPath);
    setShowSuggestions(false);
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  // load account from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("account");
      if (raw) setAccount(JSON.parse(raw));
    } catch (err) {
      setAccount(null);
    }
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
        const url = (searchType === 'person')
          ? `${API_BASE}/tmdb/search_person?q=${encodeURIComponent(query)}`
          : `${API_BASE}/tmdb/search?q=${encodeURIComponent(query)}`;
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
    let searchPath = `/search?q=${encodeURIComponent(title)}`;
    try {
      const raw = localStorage.getItem('tmdb_filters');
      if (raw) {
        const f = JSON.parse(raw);
        const params = new URLSearchParams();
        params.append('q', title);
        if (searchType && searchType !== 'title') params.append('search_by', searchType);
        if (f.year_from) params.append('year_from', f.year_from);
        if (f.year_to) params.append('year_to', f.year_to);
        if (f.with_genres) params.append('with_genres', f.with_genres);
        searchPath = `/search?${params.toString()}`;
      }
    } catch (e) {}
    navigate(searchPath);
    setShowSuggestions(false);
    setQuery(title);
  }

  function toggleMenu() {
    setMenuOpen(v => !v);
  }

  return (
    <header className="app-header" ref={wrapperRef}>
      <div className="header-left">
        <button className="logo-button" onClick={() => navigate('/')}>Home</button>
      </div>

      <form className="search-form" onSubmit={onSubmit} role="search" autoComplete="off">
        <div className="search-inner">
          <label style={{ marginRight: 8 }}>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="title">Title</option>
              <option value="person">Person</option>
            </select>
          </label>
          <div className="search-input-container">
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
              <div className="suggestions-dropdown">
              {loadingSuggestions && <div className="suggestion-loading">Loading...</div>}
              {!loadingSuggestions && suggestions.length === 0 && (
                <div className="suggestion-empty">No suggestions</div>
              )}
              {!loadingSuggestions && suggestions.map((s) => {
                const primaryTitle = s.title || s.name || s.original_title || s.original_name || s.media_type || `#${s.id}`;
                const year = s.release_date?.slice(0,4) || s.first_air_date?.slice(0,4) || '';
                const imagePath = (searchType === 'person') ? s.profile_path : s.poster_path;
                return (
                <div
                  key={s.id}
                  onClick={() => onSelectSuggestion(primaryTitle)}
                  className="suggestion-item"
                >
                  {imagePath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${imagePath}`}
                      alt={primaryTitle}
                      className="suggestion-poster"
                    />
                  ) : (
                    <div className="suggestion-poster--placeholder" />
                  )}
                  <div className="suggestion-meta">
                    <strong className="suggestion-title">{primaryTitle}</strong>
                    {searchType === 'person' && s.known_for_department && (
                      <div className="suggestion-sub">{s.known_for_department}</div>
                    )}
                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
          <button className="search-button" type="submit" aria-label="Hae">Hae</button>
        </div>
      </form>

      <nav className="header-right" aria-label="Päävalikko">
        <button className="nav-button" onClick={() => (window.location.href = "/groups")}>Ryhmät</button>

        {account ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
              className="nav-button profile-button"
              onClick={() => setShowProfileMenu((s) => !s)}
              title={account.username}
            >
              <div className="avatar-circle">
                {account.username ? account.username.charAt(0).toUpperCase() : '?'}
              </div>
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="profile-menu-button">Oma profiili</button>
                <button onClick={() => { setShowProfileMenu(false); navigate('/owngroups'); }} className="profile-menu-button">Omat ryhmät</button>
                <button onClick={() => {
                  // logout
                  localStorage.removeItem('token');
                  localStorage.removeItem('account');
                  setAccount(null);
                  setShowProfileMenu(false);
                  navigate('/login');
                }} className="profile-menu-button logout-button">Kirjaudu ulos</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              className="nav-button"
              onClick={() => (window.location.href = "/login")}
            >
              Kirjaudu
            </button>
            <button
              className="menu-toggle"
              aria-label="Valikko"
              onClick={toggleMenu}
            >
              ☰
            </button>
          </>
        )}
      </nav>

      {menuOpen && (
        <div className="mobile-nav" role="menu">
          <button className="nav-button" onClick={() => { setMenuOpen(false); window.location.href = '/groups'; }}>Ryhmät</button>
          <button className="nav-button" onClick={() => { setMenuOpen(false); window.location.href = '/login'; }}>Kirjaudu</button>
        </div>
      )}
    </header>
  );
}

export default Header;
