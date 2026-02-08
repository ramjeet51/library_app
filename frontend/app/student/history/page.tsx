"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const USER_ID = 2;

export default function StudentHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    const data = await api(`/student/history?user_id=${USER_ID}`);
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="card page-animate">
      <h2>📄 Issue History</h2>

      {history.length === 0 && <p>No history found</p>}

      <div className="book-list">
        {history.map((h, i) => (
          <div key={i} className="list-row">
            <div>
              <b>{h.book_name}</b>
              <div>Issued: {new Date(h.issued_at).toLocaleDateString()}</div>
              <div>
                Returned:{" "}
                {h.returned_at
                  ? new Date(h.returned_at).toLocaleDateString()
                  : "Not returned"}
              </div>
            </div>

            <div><b>Days:</b> {h.days}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
