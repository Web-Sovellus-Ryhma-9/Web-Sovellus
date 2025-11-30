import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import { Link, useParams } from "react-router-dom";

export default function SpecificGroup() {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { id } = useParams();

  const placeholderMovies = [
    { id: 1, title: "Movie 1", image: null },
    { id: 2, title: "Movie 2", image: null },
    { id: 3, title: "Movie 3", image: null },
    { id: 4, title: "Movie 4", image: null },
    { id: 5, title: "Movie 5", image: null },
    { id: 6, title: "Movie 6", image: null },
  ];

  const placeholderShowtimes = [
    { id: "s1", date: "2025-11-20 18:30", title: "Movie 1" },
    { id: "s2", date: "2025-11-21 14:15", title: "Movie 2" },
    { id: "s3", date: "2025-11-22 20:00", title: "Movie 3" },
    { id: "s4", date: "2025-11-23 12:00", title: "Movie 4" },
  ];

  const placeholderMembers = [
    { id: "m1", name: "Member 1" },
    { id: "m2", name: "Member 2" },
    { id: "m3", name: "Member 3" },
    { id: "m4", name: "Member 4" },
  ];

  function handleConfirmLeave() {
    // TODO: implement actual leave logic
    setShowLeaveConfirm(false);
  }

  return (
    <div>
      <Header />
      <div className="page-container group-page">
        <h2 className="group-title">Group Name (placeholder)</h2>

        <div className="group-movies-section">
          <label className="section-label" htmlFor="group-movies-grid">
            Group Movies
          </label>

          <div id="group-movies-grid" className="group-movie-grid">
            {placeholderMovies.map((m) => (
              <Link key={m.id} to="/movie/1" className="group-movie-link">
                <div className="group-movie-card">
                  <div className="group-movie-image">
                    {m.image ? (
                      <img src={m.image} alt={m.title} />
                    ) : (
                      <div className="group-movie-placeholder">Image</div>
                    )}
                  </div>
                  <div className="group-movie-name">{m.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="group-showtimes-section">
          <label className="section-label" htmlFor="group-showtimes-list">
            Showtimes
          </label>
          <div id="group-showtimes-list" className="showtime-list">
            {placeholderShowtimes.map((s) => (
              <div key={s.id} className="showtime-item">
                <div className="showtime-date">{s.date}</div>
                <Link to="/movie/1" className="showtime-movie showtime-movie-link">
                  {s.title}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Members + actions */}
        <div className="group-members-section">
          <label className="section-label" htmlFor="group-members-list">
            Group Members
          </label>
          <div className="members-actions-row">
            <ul id="group-members-list" className="member-list">
              {placeholderMembers.map((m) => (
                <li key={m.id} className="member-item">
                  <div className="member-avatar">👤</div>
                  <span className="member-name">{m.name}</span>
                </li>
              ))}
            </ul>

            <div className="group-actions">
              <button className="btn" onClick={() => setShowLeaveConfirm(true)}>Leave Group</button>
              <Link to={`/handlegroup/${id ?? 1}`}>
                <button className="btn">Manage Group</button>
              </Link>
            </div>
          </div>
        </div>

        {showLeaveConfirm && (
          <div
            className="modal-overlay"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-group-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="leave-group-title">Leave Group</h3>
              <p>Are you sure you want to leave the group?</p>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
                <button className="btn danger" onClick={handleConfirmLeave}>Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}