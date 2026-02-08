"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StudentPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const USER_ID = 2; // temporary (JWT later)

  // ======================
  // LOAD DATA
  // ======================
  const loadBooks = async () => {
    const data = await api(`/books/search?q=${search}`);
    setBooks(data);
  };

  const loadIssued = async () => {
    const data = await api(`/student/issued?user_id=${USER_ID}`);
    setIssued(data);
  };

  // ======================
  // ACTIONS
  // ======================
  const takeBook = async (bookId: number) => {
    await api(`/student/issue/${bookId}?user_id=${USER_ID}`, "POST");
    loadBooks();
    loadIssued();
  };

  const returnBook = async (bookId: number) => {
    await api(`/student/return/${bookId}?user_id=${USER_ID}`, "POST");
    loadBooks();
    loadIssued();
  };

  useEffect(() => {
    loadBooks();
    loadIssued();
  }, [search]);

  // ======================
  // UI
  // ======================
  return (
    <div className="card admin layout">
      <div className="sidebar">
        <button className="active">📚 All Books</button>
      </div>

      <div className="content">
        <h2>All Books</h2>

        {/* SEARCH */}
        <input
          className="input"
          placeholder="Search book..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {books.length === 0 && <p>No books available</p>}

        {books.map((b) => {
          const issuedBook = issued.find(
            (i: any) => i.book_id === b.id
          );

          return (
            <div key={b.id} className="list-row">
              <span>
                {b.title} (Available: {b.total})
              </span>

              {issuedBook ? (
                <button
                  className="btn"
                  onClick={() => returnBook(b.id)}
                >
                  Return (Days: {issuedBook.days})
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={b.total <= 0}
                  onClick={() => takeBook(b.id)}
                >
                  Take
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
