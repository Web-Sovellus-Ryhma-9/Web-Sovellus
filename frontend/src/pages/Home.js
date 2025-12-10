import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/Home.css";

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
        setMovies((data.results || []).slice(0, 35));
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
  }, []);

  const navigate = useNavigate();

  // We'll auto-scroll the wrapper's scrollLeft for a smooth, pausable loop.
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const rafId = useRef(null);
  const lastTs = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  // scrolling speed in pixels per second
  const speedPxPerSec = 80;

  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      // each duplicated copy is half the scrollWidth
      const w = t.scrollWidth / 2 || 0;
      setTrackWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [movies]);

  // RAF-based auto-scroll. Uses wrapper.scrollLeft so pausing + manual scroll integrates smoothly.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || trackWidth === 0) return;

    const step = (ts) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      // advance scroll
      wrapper.scrollLeft += speedPxPerSec * dt;
      // loop when we've scrolled past one copy
      if (wrapper.scrollLeft >= trackWidth) {
        wrapper.scrollLeft -= trackWidth;
      }
      rafId.current = requestAnimationFrame(step);
    };

    if (!isPaused) {
      // ensure overflow hidden while animating
      wrapper.style.overflowX = "hidden";
      lastTs.current = null;
      rafId.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [isPaused, trackWidth]);

  // Pause on hover and allow manual scrolling only via mouse wheel while paused
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMouseEnter = () => {
      setIsPaused(true);
      // allow horizontal scrolling while paused
      wrapper.style.overflowX = "auto";
      wrapper.style.cursor = "default";
    };
    const onMouseLeave = () => {
      setIsPaused(false);
      wrapper.style.overflowX = "hidden";
      wrapper.style.cursor = "default";
    };

    const onWheel = (e) => {
      // Only intercept wheel when paused and there is horizontal overflow
      if (!isPaused) return;
      if (wrapper.scrollWidth <= wrapper.clientWidth) return;
      // Prevent page vertical scroll while over the carousel
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      const factor = 1.2;
      wrapper.scrollLeft += delta * factor;
    };

    wrapper.addEventListener("mouseenter", onMouseEnter);
    wrapper.addEventListener("mouseleave", onMouseLeave);
    wrapper.addEventListener("wheel", onWheel, { passive: false });
    // touch: pause while user is touching the screen so they can swipe to scroll
    const onTouchStart = () => {
      setIsPaused(true);
      wrapper.style.overflowX = "auto";
    };
    const onTouchEnd = () => {
      setIsPaused(false);
      wrapper.style.overflowX = "hidden";
    };
    wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
    wrapper.addEventListener("touchend", onTouchEnd);

    return () => {
      wrapper.removeEventListener("mouseenter", onMouseEnter);
      wrapper.removeEventListener("mouseleave", onMouseLeave);
      wrapper.removeEventListener("wheel", onWheel);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPaused, trackWidth]);

  return (
    <div>
      <Header />
      <div className="home-container">
        <h1>Welcome</h1>
        <p>Welcome to the application. Use the top menu to navigate to different pages or search for content using the search bar.</p>

        <h2>Now Playing</h2>

        {loading && <p>Loading movies...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {loading && <p>Loading movies...</p>}
        {error && <p className="error-text">Error: {error}</p>}

        {!loading && !error && (
          <div
            className="carousel-wrapper"
            ref={wrapperRef}
          >
            {}
            <div className="scroll-track" ref={trackRef}>
              {[0, 1].map((rep) => (
                <div key={rep} className="carousel-copy">
                  {movies.map((m) => (
                    <div
                      key={`${rep}-${m.id}`}
                      className="movie-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/movie/${m.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movie/${m.id}`); }}
                    >
                      {m.poster_path ? (
                        <img className="movie-poster" src={`${TMDB_IMAGE}${m.poster_path}`} alt={m.title} />
                      ) : (
                        <div className="movie-placeholder">{m.title}</div>
                      )}
                      <div className="movie-info">
                        <strong>{m.title}</strong>
                        <div className="movie-premiere">{"Premiere: "}{m.release_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}