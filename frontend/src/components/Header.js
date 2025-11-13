import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    if (!query) return;
    // Navigate to the search page with query param
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="logo-button" onClick={() => navigate('/')}>Home</button>
      </div>

      <form className="search-form" onSubmit={onSubmit} role="search">
        <input
          className="search-input"
          type="search"
          placeholder="Hae..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Haku"
        />
        <button className="search-button" type="submit" aria-label="Hae">Hae</button>
      </form>

      <nav className="header-right" aria-label="Päävalikko">
        <button className="nav-button" onClick={() => (window.location.href = "/ryhmat")}>Ryhmät</button>
        <button className="nav-button" onClick={() => (window.location.href = "/login")}>Kirjaudu</button>
      </nav>
    </header>
  );
}

export default Header;
