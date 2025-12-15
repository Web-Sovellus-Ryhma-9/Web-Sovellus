import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Header.css";
import logo from "../assets/logo/PopcornHub_logo.png";

function Header() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState('all');
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

  function resolveAvatarPath(name) {
    if (!name) return null;
    const clean = String(name).replace(/^\//, "");
    if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;
    return `${process.env.PUBLIC_URL || ""}/${clean}`;
  }

  function onSubmit(e) {
    e.preventDefault();
    let searchPath = "/search";
      try {
        const raw = localStorage.getItem('tmdb_filters');
        const params = new URLSearchParams();
        if (query) params.append('q', query);
      if (searchType === 'person') params.append('search_by', 'person');
      else if (searchType) params.append('type', searchType);
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

  useEffect(() => {
    const syncAccount = () => {
      try {
        const raw = localStorage.getItem("account");
        setAccount(raw ? JSON.parse(raw) : null);
      } catch (err) {
        setAccount(null);
      }
    };
    syncAccount();
    const onStorage = () => syncAccount();
    const onAccountUpdated = () => syncAccount();
    window.addEventListener("storage", onStorage);
    window.addEventListener("account-updated", onAccountUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("account-updated", onAccountUpdated);
    };
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const url = (searchType === 'person')
          ? `${API_BASE}/tmdb/search_person?q=${encodeURIComponent(query)}`
          : `${API_BASE}/tmdb/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(searchType)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
            console.log('TMDB search results for', query, json.results);
        const rawResults = (json.results || []).slice(0, 10);
        let top;
        if (searchType === 'person') {
          const byName = {};
          for (const p of rawResults) {
            const name = (p.name || '').trim().toLowerCase();
            if (!name) continue;
            if (!byName[name]) {
              byName[name] = p;
            } else {
              const current = byName[name];
              const curHasImage = !!current.profile_path;
              const pHasImage = !!p.profile_path;
              if (pHasImage && !curHasImage) {
                byName[name] = p;
                continue;
              }
              if ((p.popularity || 0) > (current.popularity || 0)) {
                byName[name] = p;
              }
            }
          }
          top = Object.values(byName).slice(0, 5);
        } else {
          if (searchType === 'all') {
            const movies = rawResults.filter(r => r.media_type === 'movie');
            const tvs = rawResults.filter(r => r.media_type === 'tv');
            const mixed = [];
            let i = 0;
            while (mixed.length < 5 && (i < movies.length || i < tvs.length)) {
              if (i < movies.length) mixed.push(movies[i]);
              if (mixed.length >= 5) break;
              if (i < tvs.length) mixed.push(tvs[i]);
              i++;
            }
            for (const r of rawResults) {
              if (mixed.length >= 5) break;
              if (!mixed.includes(r)) mixed.push(r);
            }
            top = mixed.slice(0,5);
          } else {
            top = rawResults.slice(0,5);
          }
        }
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

  function onSelectSuggestion(item) {
    const primaryTitle = item.title || item.name || item.original_title || item.original_name || `#${item.id}`;

    const isMovie = Boolean(item.title || item.media_type === 'movie' || item.release_date);
    const isTv = Boolean(item.name || item.media_type === 'tv' || item.first_air_date);
    if (isMovie && item.id) {
      navigate(`/movie/${item.id}`);
      setShowSuggestions(false);
      setQuery(primaryTitle);
      return;
    }
    if (isTv && item.id) {
      navigate(`/tv/${item.id}`);
      setShowSuggestions(false);
      setQuery(primaryTitle);
      return;
    }

    let searchPath = `/search?q=${encodeURIComponent(primaryTitle)}`;
    try {
      const raw = localStorage.getItem('tmdb_filters');
      if (raw) {
        const f = JSON.parse(raw);
        const params = new URLSearchParams();
        params.append('q', primaryTitle);
        if (searchType === 'person') params.append('search_by', 'person');
        else if (searchType) params.append('type', searchType);
        if (f.year_from) params.append('year_from', f.year_from);
        if (f.year_to) params.append('year_to', f.year_to);
        if (f.with_genres) params.append('with_genres', f.with_genres);
        searchPath = `/search?${params.toString()}`;
      }
    } catch (e) {}
    navigate(searchPath);
    setShowSuggestions(false);
    setQuery(primaryTitle);
  }

  function handleSuggestionClick(s, primaryTitle) {
    if ((searchType === 'movie' || (searchType === 'all' && s && s.media_type === 'movie')) && s && s.id && s.title) {
      setShowSuggestions(false);
      setQuery(primaryTitle || s.title || '');
      navigate(`/movie/${s.id}`);
      return;
    }
    if ((searchType === 'tv' || (searchType === 'all' && s && s.media_type === 'tv')) && s && s.id && s.name) {
      setShowSuggestions(false);
      setQuery(primaryTitle || s.name || '');
      navigate(`/tv/${s.id}`);
      return;
    }

    if (searchType === 'person' && s && s.name) {
      try {
        const params = new URLSearchParams();
        params.append('q', s.name);
        params.append('search_by', 'person');
        const raw = localStorage.getItem('tmdb_filters');
        if (raw) {
          const f = JSON.parse(raw);
          if (f.year_from) params.append('year_from', f.year_from);
          if (f.year_to) params.append('year_to', f.year_to);
          if (f.with_genres) params.append('with_genres', f.with_genres);
        }
        setShowSuggestions(false);
        setQuery(s.name);
        navigate(`/search?${params.toString()}`);
      } catch (e) {
        onSelectSuggestion(primaryTitle || s.name || '');
      }
      return;
    }

    onSelectSuggestion(primaryTitle || s.title || s.name || '');
  }

  function toggleMenu() {
    setMenuOpen(v => !v);
  }

  return (
    <header className="app-header" ref={wrapperRef}>
      <div className="header-left">
        <button className="logo-button" onClick={() => navigate('/')} aria-label="Home">
          <img src={logo} alt="PopcornHub" className="app-logo" />
        </button>
      </div>

      <form className="search-form" onSubmit={onSubmit} role="search" autoComplete="off">
        <div className="search-inner">
          <label style={{ marginRight: 8 }}>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="all">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV-series</option>
              <option value="person">Celebrities</option>
            </select>
          </label>
          <div className="search-input-container">
            <input
              className="search-input"
              type="search"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
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
                const imagePath = s.profile_path || s.poster_path;
                return (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s, primaryTitle)}
                  className="suggestion-item"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSuggestionClick(s, primaryTitle); }}
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
          <button className="search-button" type="submit" aria-label="Search">Search</button>
        </div>
      </form>

      <nav className="header-right" aria-label="Main menu">
        <button className="nav-button" onClick={() => (window.location.href = "/groups")}>Groups</button>

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
                {resolveAvatarPath(account.avatar) ? (
                  <img src={resolveAvatarPath(account.avatar)} alt="Avatar" className="avatar-circle-img" />
                ) : (
                  (account.username ? account.username.charAt(0).toUpperCase() : '?')
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="profile-menu-button">My Profile</button>
                <button onClick={() => { setShowProfileMenu(false); navigate('/owngroups'); }} className="profile-menu-button">My Groups</button>
                <button onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('account');
                  setAccount(null);
                  setShowProfileMenu(false);
                  navigate('/login');
                }} className="profile-menu-button logout-button">Log Out</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              className="nav-button"
              onClick={() => (window.location.href = "/login")}
            >
              Log In
            </button>
            <button
              className="menu-toggle"
              aria-label="Menu"
              onClick={toggleMenu}
            >
              ☰
            </button>
          </>
        )}
      </nav>

      {menuOpen && (
        <div className="mobile-nav" role="menu">
          <button className="nav-button" onClick={() => { setMenuOpen(false); window.location.href = '/groups'; }}>Groups</button>
          <button className="nav-button" onClick={() => { setMenuOpen(false); window.location.href = '/login'; }}>Log In</button>
        </div>
      )}
    </header>
  );
}

export default Header;
