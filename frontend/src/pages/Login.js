import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/Auth.css";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: formData.username, password: formData.password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || JSON.stringify(data));
        if (data.token) localStorage.setItem("token", data.token);
        if (data.account) localStorage.setItem("account", JSON.stringify(data.account));
        window.location.href = "/";
      })
      .catch((err) => {
        console.error(err);
        setModalContent({ title: "Login Failed", message: `Login failed: ${err.message}` });
        setShowModal(true);
      });
  };
  return (
    <div>
      <Header />
      <div className="page-container auth-page-container">
        <h2 className="auth-title">Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <input
              className="auth-input"
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <input
              className="auth-input"
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <span
            className="nav-text-button"
            onClick={() => (window.location.href = "/Register")}
          >
            Not registered? Click here!
          </span>
          <button type="submit" className="btn primary auth-submit">
            Login
          </button>
        </form>
        {showModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="modal-title">{modalContent.title}</h3>
              <p>{modalContent.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
