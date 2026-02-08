"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await api("/login", "POST", {
        email,
        password,
      });

      // store token & role
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);

      // redirect based on role
      if (res.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/student";
      }
    } catch (err: any) {
      alert(err?.detail || "Login failed");
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn" onClick={login}>
        Login
      </button>
    </div>
  );
}
