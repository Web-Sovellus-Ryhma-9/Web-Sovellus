import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/SharedFavorite.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SharedFavorite() {
  const query = useQuery();
  const listId = query.get('list');
  const API = process.env.REACT_APP_API_URL || "";
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('account');
      if (raw) setAccount(JSON.parse(raw));
    } catch (e) {
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!listId) return setLoading(false);
      try {
        const res = await fetch(`${API}/favorites/public/${encodeURIComponent(listId)}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        if (!cancelled) setList(data);
      } catch (e) {
        if (!cancelled) setList(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [listId]);
  
  const userName = account?.username;
  const title = userName
    ? `${userName}'s favorite movies`
    : "Shared favorites";

  return (
    <div>
      <Header />
      <div className="page-container shared-favorites-page">
        <h2>{title}</h2>
        {!listId ? (
          <p>Share the link in the format <code>?list=&lt;listId&gt;</code></p>
        ) : loading ? (
          <p>Loading shared list…</p>
        ) : !list ? (
          <p>List not found or it is empty.</p>
        ) : (
          <div>
            <h3>{list.listName || 'Shared favorite list'}</h3>
            {list.items && list.items.length === 0 ? (
              <p>List is empty.</p>
            ) : (
              <SharedItems items={list.items} api={API} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SharedItems({ items, api }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadThumbs() {
      try {
        const mapped = await Promise.all(
          items.map(async (it) => {
            try {
              // Decode media_type if it's encoded in movie_id (format: "tv:123" or "movie:456")
              let movieId = it.movie_id;
              let mediaType = it.media_type || 'movie';
              
              const parts = String(movieId).split(':');
              if (parts.length === 2 && (parts[0] === 'tv' || parts[0] === 'movie')) {
                mediaType = parts[0];
                movieId = parts[1];
              }
              
              // Use the correct TMDB endpoint based on media type
              const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
              const res = await fetch(`${api}/tmdb/${endpoint}/${encodeURIComponent(movieId)}`);
              if (!res.ok) return { ...it, image: null, decoded_id: movieId, media_type: mediaType };
              const j = await res.json();
              const image = j.poster_path ? `https://image.tmdb.org/t/p/w154${j.poster_path}` : null;
              return { ...it, image, decoded_id: movieId, media_type: mediaType };
            } catch (e) {
              return { ...it, image: null, decoded_id: it.movie_id, media_type: it.media_type || 'movie' };
            }
          })
        );
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) setRows(items.map(i => ({ ...i, image: null })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadThumbs();
    return () => { cancelled = true; };
  }, [items, api]);

  if (loading) return <p>Loading images…</p>;

  return (
    <div className="shared-items-grid">
      {rows.map(item => (
        <div key={item.movie_id} className="shared-item-card">
          <div className="shared-item-image-wrapper">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title || 'Poster'}
                className="shared-item-image"
              />
            ) : (
              <div className="shared-item-placeholder">No image</div>
            )}
          </div>
          <div className="shared-item-content">
            <Link
              to={`/${item.media_type || 'movie'}/${item.decoded_id || item.movie_id}`}
              className="shared-item-link"
            >
              {item.title || 'Unnamed'}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
