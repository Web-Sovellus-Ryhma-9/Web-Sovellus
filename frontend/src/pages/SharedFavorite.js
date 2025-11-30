import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "../components/Header";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SharedFavorite() {
  const query = useQuery();
  const listId = query.get('list');
  const API = process.env.REACT_APP_API_URL || "";
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState(null);

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

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2>Jaetut suosikit</h2>
        {!listId ? (
          <p>Jaa linkki muodossa <code>?list=&lt;listId&gt;</code></p>
        ) : loading ? (
          <p>Ladataan jaettua listaa…</p>
        ) : !list ? (
          <p>Lista ei löytynyt tai se on tyhjä.</p>
        ) : (
          <div>
            <h3>{list.listName || 'Jaettu suosikkilista'}</h3>
            {list.items && list.items.length === 0 ? (
              <p>Lista on tyhjä.</p>
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
              const res = await fetch(`${api}/tmdb/movie/${encodeURIComponent(it.movie_id)}`);
              if (!res.ok) return { ...it, image: null };
              const j = await res.json();
              const image = j.poster_path ? `https://image.tmdb.org/t/p/w154${j.poster_path}` : null;
              return { ...it, image };
            } catch (e) {
              return { ...it, image: null };
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

  if (loading) return <p>Ladataan kuvia…</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {rows.map(item => (
        <div key={item.movie_id} style={{ border: '1px solid #eee', padding: 8, display: 'flex', gap: 12 }}>
          <div style={{ width: 92, height: 138, flex: '0 0 auto' }}>
            {item.image ? (
              <img src={item.image} alt={item.title || 'Poster'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>No image</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Link to={`/movie/${item.movie_id}`} style={{ textDecoration: 'none', color: '#222', fontWeight: 600 }}>{item.title || 'Nimetön'}</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
