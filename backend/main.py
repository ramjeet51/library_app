from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from database import get_db, engine
from models import Base, User, Book, Issue
from service import LibraryService

# =========================
# CONSTANTS
# =========================
MAX_BOOKS = 2
FREE_DAYS = 7
FINE_PER_DAY = 5

# =========================
# DB INIT
# =========================
Base.metadata.create_all(bind=engine)

# =========================
# APP
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://libraryapp.com",
        "https://libraryapp.com",

        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# AUTH
# =========================
@app.post("/register")
def register(data: dict, db: Session = Depends(get_db)):
    try:
        LibraryService(db).register(data)
        return {"msg": "Registered successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    try:
        return LibraryService(db).login(data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# =========================
# ADMIN
# =========================
@app.post("/admin/book")
def add_book(data: dict, db: Session = Depends(get_db)):
    LibraryService(db).add_book(data)
    return {"msg": "Book added successfully"}


@app.get("/admin/books")
def admin_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


@app.get("/admin/issued")
def admin_issued(db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            users.name AS student_name,
            users.email,
            books.title AS book_title,
            DATEDIFF(CURDATE(), issues.issued_at) AS days
        FROM issues
        JOIN users ON users.id = issues.user_id
        JOIN books ON books.id = issues.book_id
        WHERE issues.returned_at IS NULL
    """)
    return db.execute(query).mappings().all()


@app.get("/admin/history")
def admin_history(db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            users.name AS student_name,
            books.title AS book_name,
            issues.issued_at,
            issues.returned_at,
            DATEDIFF(
                IFNULL(issues.returned_at, CURDATE()),
                issues.issued_at
            ) AS days
        FROM issues
        JOIN users ON users.id = issues.user_id
        JOIN books ON books.id = issues.book_id
        ORDER BY issues.issued_at DESC
    """)
    return db.execute(query).mappings().all()


@app.delete("/admin/book/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    active_issues = db.query(Issue).filter(
        Issue.book_id == book_id,
        Issue.returned_at == None
    ).count()

    if active_issues > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete book. It is currently issued."
        )

    db.delete(book)
    db.commit()
    return {"msg": "Book deleted successfully"}


@app.patch("/admin/book/{book_id}/reduce")
def reduce_book_quantity(book_id: int, qty: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if qty <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be > 0")

    if qty > book.total:
        raise HTTPException(
            status_code=400,
            detail=f"Only {book.total} copies available"
        )

    book.total -= qty
    db.commit()

    return {"msg": f"{qty} copies removed", "remaining": book.total}

# =========================
# STUDENT
# =========================
@app.get("/books/search")
def search_books(q: str = "", db: Session = Depends(get_db)):
    if not q:
        return db.query(Book).all()

    return db.query(Book).filter(Book.title.ilike(f"%{q}%")).all()


@app.get("/student/issued")
def student_issued(user_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            books.id AS book_id,
            books.title AS book_name,
            DATEDIFF(CURDATE(), issues.issued_at) AS days
        FROM issues
        JOIN books ON books.id = issues.book_id
        WHERE issues.user_id = :uid
          AND issues.returned_at IS NULL
    """)

    rows = db.execute(query, {"uid": user_id}).mappings().all()

    result = []
    for r in rows:
        fine = max(0, (r["days"] - FREE_DAYS) * FINE_PER_DAY)
        result.append({
            "book_id": r["book_id"],
            "book_name": r["book_name"],
            "days": r["days"],
            "fine": fine
        })

    return result


@app.get("/student/history")
def student_history(user_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            books.title AS book_name,
            issues.issued_at,
            issues.returned_at,
            DATEDIFF(
                IFNULL(issues.returned_at, CURDATE()),
                issues.issued_at
            ) AS days
        FROM issues
        JOIN books ON books.id = issues.book_id
        WHERE issues.user_id = :uid
        ORDER BY issues.issued_at DESC
    """)

    rows = db.execute(query, {"uid": user_id}).mappings().all()

    history = []
    for r in rows:
        fine = max(0, (r["days"] - FREE_DAYS) * FINE_PER_DAY)
        history.append({**r, "fine": fine})

    return history


@app.post("/student/issue/{book_id}")
def student_issue(book_id: int, user_id: int, db: Session = Depends(get_db)):
    active_count = db.query(Issue).filter(
        Issue.user_id == user_id,
        Issue.returned_at == None
    ).count()

    if active_count >= MAX_BOOKS:
        raise HTTPException(
            status_code=400,
            detail="Book limit reached (Max 2 books allowed)"
        )

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book or book.total <= 0:
        raise HTTPException(status_code=400, detail="Book not available")

    already = db.query(Issue).filter(
        Issue.user_id == user_id,
        Issue.book_id == book_id,
        Issue.returned_at == None
    ).first()

    if already:
        raise HTTPException(status_code=400, detail="Already issued")

    issue = Issue(user_id=user_id, book_id=book_id)
    book.total -= 1

    db.add(issue)
    db.commit()

    return {"msg": "Book issued successfully"}


@app.post("/student/return/{book_id}")
def student_return(book_id: int, user_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(
        Issue.user_id == user_id,
        Issue.book_id == book_id,
        Issue.returned_at == None
    ).first()

    if not issue:
        raise HTTPException(
            status_code=400,
            detail="Book already returned or not issued"
        )

    issue.returned_at = datetime.utcnow()

    book = db.query(Book).filter(Book.id == book_id).first()
    book.total += 1

    db.commit()
    return {"msg": "Book returned successfully"}
