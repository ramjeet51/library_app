"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  async function handleRegister() {
    try {
      await api("/register", "POST", form);
      alert("Registered successfully");
      router.push("/");
    } catch (err: any) {
    // 👇 backend से आने वाला message
    alert(err.message || "User already exists");
  }
  }

  return (
    <div className="card">
      <h2>Register</h2>

      <input
        className="input"
        placeholder="Name"
        value={form.name}
        autoComplete="off"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="input"
        type="email"
        placeholder="Email"
        value={form.email}
        autoComplete="off"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={form.password}
        autoComplete="new-password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <select
        className="select"
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>

      <button className="btn" onClick={handleRegister}>
        Register
      </button>

      <div className="link">
        Already have an account? <a href="/">Login</a>
      </div>
    </div>
  );
}
