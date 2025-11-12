import React, { useState } from "react";
import "./Header.css";

function Header() {
  const [query, setQuery] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    // For now we'll just log the query. This can be wired to routing or API later.
    console.log("Search:", query);
    // Optionally navigate to a search page: window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="logo-button" onClick={() => (window.location.href = "/")}>Home</button>
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
