"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type View = "add" | "books" | "issued";

export default function AdminPage() {
  const [view, setView] = useState<View>("books");

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState<number>(1);
  const [search, setSearch] = useState("");

  const [books, setBooks] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ======================
  // API CALLS
  // ======================
  const loadBooks = async () => {
    const data = await api(`/books/search?q=${search}`);
    setBooks(data);
  };

  const loadIssued = async () => {
    const data = await api("/admin/issued");
    setIssued(data);
  };

  const addBook = async () => {
    if (!title || total <= 0) {
      alert("Please enter valid book title and quantity");
      return;
    }

    await api("/admin/book", "POST", { title, total });

    setTitle("");
    setTotal(1);
    setView("books");
    loadBooks();
  };

  // ======================
  // DELETE BOOK (FULL)
  // ======================
  const deleteBook = async (bookId: number) => {
    const ok = confirm("Delete this book completely?");
    if (!ok) return;

    try {
      await api(`/admin/book/${bookId}`, "DELETE");
      loadBooks();
    } catch (err: any) {
      alert(err?.detail || "Cannot delete (book may be issued)");
    }
  };

  // ======================
  // REDUCE BOOK QTY
  // ======================
  const reduceBook = async (bookId: number) => {
    const qtyStr = prompt("Enter quantity to reduce:");
    if (!qtyStr) return;

    const qty = Number(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      alert("Invalid quantity");
      return;
    }

    try {
      await api(`/admin/book/${bookId}/reduce?qty=${qty}`, "PATCH");
      loadBooks();
    } catch (err: any) {
      alert(err?.detail || "Cannot reduce quantity");
    }
  };

  // ======================
  // EFFECT
  // ======================
  useEffect(() => {
    if (view === "books") loadBooks();
    if (view === "issued") loadIssued();
  }, [view, search]);

  // ======================
  // UI
  // ======================
  return (
    <div className="card admin layout page-animate">
      {/* ================= SIDEBAR ================= */}
      <div className="sidebar">
        <button
          className={view === "add" ? "active" : ""}
          onClick={() => setView("add")}
        >
          ➕ Add Book
        </button>

        <button
          className={view === "books" ? "active" : ""}
          onClick={() => setView("books")}
        >
          📚 All Books
        </button>

        <button
          className={view === "issued" ? "active" : ""}
          onClick={() => setView("issued")}
        >
          👤 Issued Books
        </button>

        <button
          style={{ marginTop: "auto", background: "#dc2626" }}
          onClick={logout}
        >
          🚪 Logout
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="content">
        {/* ---------- ADD BOOK ---------- */}
        {view === "add" && (
          <>
            <h2>Add Book</h2>

            <input
              className="input"
              placeholder="Book Title (e.g. C++)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="input"
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
            />

            <button className="btn" onClick={addBook}>
              Add Book
            </button>
          </>
        )}

        {/* ---------- ALL BOOKS ---------- */}
        {view === "books" && (
          <>
            <h2>All Books</h2>

            <input
              className="input"
              placeholder="Search book..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {books.length === 0 && <p>No books found</p>}

            {/* 🔽 SCROLLABLE BOOK LIST */}
            <div className="book-list">
              {books.map((b) => (
                <div key={b.id} className="list-row">
                  <div>
                    <div>📘 {b.title}</div>
                    <div>Qty: {b.total}</div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn"
                      style={{ background: "#f59e0b" }}
                      onClick={() => reduceBook(b.id)}
                    >
                      ➖ Reduce
                    </button>

                    <button
                      className="btn"
                      style={{ background: "#dc2626" }}
                      onClick={() => deleteBook(b.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- ISSUED BOOKS ---------- */}
        {view === "issued" && (
          <>
            <h2>Issued Books</h2>

            {issued.length === 0 && <p>No books issued</p>}

            {issued.map((i, idx) => (
              <div key={idx} className="issued-item">
                <div><b>Student:</b> {i.student_name}</div>
                <div><b>Book:</b> {i.book_title}</div>
                <div><b>Days:</b> {i.days}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
