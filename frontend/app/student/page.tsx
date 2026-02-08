"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FREE_DAYS = 7;

type View = "books" | "history";

export default function StudentPage() {
  const [view, setView] = useState<View>("books");

  const [books, setBooks] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const USER_ID = 2; // JWT later

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

  const loadHistory = async () => {
    const data = await api(`/student/history?user_id=${USER_ID}`);
    setHistory(data);
  };

  const refresh = () => {
    loadBooks();
    loadIssued();
    loadHistory();
  };

  // ======================
  // ACTIONS
  // ======================
  const takeBook = async (bookId: number) => {
    try {
      setError("");
      await api(`/student/issue/${bookId}?user_id=${USER_ID}`, "POST");
      refresh();
    } catch (err: any) {
      setError(err?.detail || "Book limit reached (Max 2 books allowed)");
    }
  };

  const returnBook = async (bookId: number) => {
    try {
      setError("");
      await api(`/student/return/${bookId}?user_id=${USER_ID}`, "POST");
      refresh();
    } catch {
      setError("Failed to return book");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    refresh();
  }, [search]);

  // ======================
  // SUMMARY
  // ======================
  const booksTaken = issued.length;

  const totalFine = issued.reduce(
    (sum: number, b: any) => sum + (b.fine || 0),
    0
  );

  const overdueDays = issued.reduce((sum: number, b: any) => {
    if (b.days > FREE_DAYS) {
      return sum + (b.days - FREE_DAYS);
    }
    return sum;
  }, 0);

  // ======================
  // UI
  // ======================
  return (
    <div className="card admin layout page-animate">
      {/* SIDEBAR */}
      <div className="sidebar">
        <button
          className={view === "books" ? "active" : ""}
          onClick={() => setView("books")}
        >
          📚 All Books
        </button>

        <button
          className={view === "history" ? "active" : ""}
          onClick={() => setView("history")}
        >
          📑 Issue History
        </button>

        <button
          style={{ marginTop: "auto", background: "#dc2626" }}
          onClick={logout}
        >
          🚪 Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">
        {/* ================= BOOKS VIEW ================= */}
        {view === "books" && (
          <>
            <h2>All Books</h2>

            {/* SUMMARY CARD */}
            <div className="summary-card">
              <div>📘 <b>Books Taken:</b> {booksTaken}</div>

              <div className={totalFine > 0 ? "fine-red" : ""}>
                💰 <b>Total Fine:</b> ₹{totalFine}
              </div>

              <div className={overdueDays > 0 ? "fine-red" : ""}>
                ⏳ <b>Overdue Days:</b> {overdueDays}
              </div>
            </div>

            {/* SEARCH */}
            <input
              className="input"
              placeholder="Search book..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && <div className="limit-warning">{error}</div>}

            {/* BOOK LIST */}
            <div className="book-list">
              {books.map((b) => {
                const issuedBook = issued.find(
                  (i: any) => i.book_id === b.id
                );

                const isOverdue =
                  issuedBook && issuedBook.days > FREE_DAYS;

                const dueText = issuedBook
                  ? issuedBook.days > FREE_DAYS
                    ? `Overdue by ${issuedBook.days - FREE_DAYS} days`
                    : `Due in ${FREE_DAYS - issuedBook.days} days`
                  : "";

                return (
                  <div
                    key={b.id}
                    className={`list-row ${
                      isOverdue ? "overdue-border" : ""
                    }`}
                  >
                    <div>
                      <div>
                        {b.title} (Available: {b.total})
                      </div>

                      {issuedBook && (
                        <small className={isOverdue ? "fine-red" : ""}>
                          ⏳ {dueText}
                        </small>
                      )}
                    </div>

                    {issuedBook ? (
                      <button
                        className="btn"
                        onClick={() => returnBook(b.id)}
                      >
                        Return (₹{issuedBook.fine})
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
          </>
        )}

        {/* ================= HISTORY VIEW ================= */}
        {view === "history" && (
          <>
            <h2>📑 Issue History</h2>

            {history.length === 0 && <p>No history found</p>}

            <div className="book-list">
              {history.map((h: any, idx: number) => (
                <div key={idx} className="list-row">
                  <div>
                    <b>{h.book_name}</b>
                    <div>
                      Issued on: {new Date(h.issued_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div
                    className={h.fine > 0 ? "fine-red" : ""}
                  >
                    Fine: ₹{h.fine}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
