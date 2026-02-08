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
      alert("Please enter book title and quantity");
      return;
    }

    await api("/admin/book", "POST", {
      title,
      total,
    });

    setTitle("");
    setTotal(1);
    setView("books");
    loadBooks();
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
    <div className="card admin layout">
      {/* SIDEBAR */}
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
      </div>

      {/* CONTENT */}
      <div className="content">
        {/* ADD BOOK */}
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

        {/* ALL BOOKS */}
        {view === "books" && (
          <>
            <h2>All Books</h2>

            {/* SEARCH */}
            <input
              className="input"
              placeholder="Search book..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {books.length === 0 && <p>No books found</p>}

            {books.map((b) => (
              <div key={b.id} className="list-row">
                <span>📘 {b.title}</span>
                <span>Qty: {b.total}</span>
              </div>
            ))}
          </>
        )}

        {/* ISSUED BOOKS */}
        {view === "issued" && (
          <>
            <h2>Issued Books</h2>

            {issued.length === 0 && <p>No books issued</p>}

            {issued.map((i, idx) => (
              <div key={idx} className="issued-item">
                <div>
                  <b>Student:</b> {i.student_name}
                </div>
                <div>
                  <b>Book:</b> {i.book_title}
                </div>
                <div>
                  <b>Days:</b> {i.days}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
