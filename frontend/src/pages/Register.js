import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/Auth.css";


export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username.length < 3) {
      setModalContent({ title: "Registration Error", message: "Username should be atleast 3 characters long." });
      setShowModal(true);
      return;
    }
    if (formData.password.length < 8) {
      setModalContent({ title: "Registration Error", message: "Password should be atleast 8 characters long." });
      setShowModal(true);
      return;
    }
    if (formData.email.length < 8) {
      setModalContent({ title: "Registration Error", message: "Email not valid." });
      setShowModal(true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setModalContent({ title: "Registration Error", message: "Passwords do not match." });
      setShowModal(true);
      return;
    }
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || JSON.stringify(data));
        setModalContent({ title: "Registration Successful", message: "Registration successful. You will be redirected to the login page." });
        setShowModal(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2500);
      })
      .catch((err) => {
        console.error(err);
        setModalContent({ title: "Registration Failed", message: `Registration failed: ${err.message}` });
        setShowModal(true);
      });
  };
  return (
    <div>
      <Header />
      <div className="page-container auth-page-container">
        <h2 className="auth-title">Register</h2>
        <form className="register-form" onSubmit={handleSubmit}>
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
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={formData.email}
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
          <div>
            <input
              className="auth-input"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <span
            className="nav-text-button"
            onClick={() => (window.location.href = "/login")}
          >
            Already registered? Log in!
          </span>
          <button type="submit" className="btn primary auth-submit">
            Register
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
