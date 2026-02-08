from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from sqlalchemy import or_

from database import get_db, engine
from models import Base, User, Book, Issue
from service import LibraryService

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
    allow_origins=["http://localhost:3000"],
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
    token, role = LibraryService(db).login(data)
    return {"token": token, "role": role}

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


@app.post("/admin/issue")
def admin_issue(data: dict, db: Session = Depends(get_db)):
    LibraryService(db).issue_book(data["user_id"], data["book_id"])
    return {"msg": "Book issued"}


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
              COALESCE(issues.returned_at, CURDATE()),
              issues.issued_at
            ) AS days
        FROM issues
        JOIN users ON users.id = issues.user_id
        JOIN books ON books.id = issues.book_id
        ORDER BY issues.issued_at DESC
    """)
    return db.execute(query).mappings().all()


# =========================
# STUDENT
# =========================
@app.get("/student/books")
def student_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


@app.get("/student/issued")
def student_issued(user_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            books.id AS book_id,
            books.title AS book_title,
            issues.issued_at,
            DATEDIFF(CURDATE(), issues.issued_at) AS days
        FROM issues
        JOIN books ON books.id = issues.book_id
        WHERE issues.user_id = :uid
    """)
    return db.execute(query, {"uid": user_id}).mappings().all()


# =========================
# STUDENT ISSUE HISTORY
# =========================
@app.get("/student/history")
def student_issue_history(user_id: int, db: Session = Depends(get_db)):
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

    FREE_DAYS = 7
    FINE_PER_DAY = 5

    result = []
    for r in rows:
        fine = 0
        if r["days"] > FREE_DAYS:
            fine = (r["days"] - FREE_DAYS) * FINE_PER_DAY

        result.append({
            "book_name": r["book_name"],
            "issued_at": r["issued_at"],
            "returned_at": r["returned_at"],
            "days": r["days"],
            "fine": fine
        })

    return result




MAX_BOOKS = 2

@app.post("/student/issue/{book_id}")
def student_issue(book_id: int, user_id: int, db: Session = Depends(get_db)):
    # count already issued books
    issued_count = db.query(Issue).filter(
        Issue.user_id == user_id
    ).count()

    if issued_count >= MAX_BOOKS:
        raise HTTPException(
            status_code=400,
            detail="Book limit reached (Max 2 books allowed)"
        )

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book or book.total <= 0:
        raise HTTPException(status_code=400, detail="Book not available")

    already = db.query(Issue).filter(
        Issue.user_id == user_id,
        Issue.book_id == book_id
    ).first()

    if already:
        raise HTTPException(status_code=400, detail="Already issued")

    issue = Issue(user_id=user_id, book_id=book_id)
    book.total -= 1

    db.add(issue)
    db.commit()
    return {"msg": "Book issued"}



FREE_DAYS = 7
FINE_PER_DAY = 5

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
    """)
    rows = db.execute(query, {"uid": user_id}).mappings().all()

    result = []
    for r in rows:
        fine = 0
        if r["days"] > FREE_DAYS:
            fine = (r["days"] - FREE_DAYS) * FINE_PER_DAY

        result.append({
            "book_id": r["book_id"],
            "book_name": r["book_name"],
            "days": r["days"],
            "fine": fine
        })

    return result


@app.post("/student/return/{book_id}")
def student_return(book_id: int, user_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(
        Issue.user_id == user_id,
        Issue.book_id == book_id,
        Issue.returned_at == None
    ).first()

    if not issue:
        raise HTTPException(status_code=400, detail="Book not issued")

    issue.returned_at = datetime.utcnow()   # 👈 IMPORTANT

    book = db.query(Book).filter(Book.id == book_id).first()
    book.total += 1

    db.commit()
    return {"msg": "Book returned"}


#for book serch logic
@app.get("/books/search")
def search_books(q: str = "", db: Session = Depends(get_db)):
    if not q:
        return db.query(Book).all()

    return db.query(Book).filter(
        Book.title.ilike(f"%{q}%")
    ).all()

#delete book logic

@app.delete("/admin/book/{book_id}")
def delete_book(book_id: int, db=Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # check if book is issued
    issued_count = db.query(Issue).filter(Issue.book_id == book_id).count()
    if issued_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete book. It is currently issued."
        )

    db.delete(book)
    db.commit()

    return {"msg": "Book deleted successfully"}


# =========================
# ADMIN - REDUCE BOOK QUANTITY
# =========================
@app.patch("/admin/book/{book_id}/reduce")
def reduce_book_quantity(
    book_id: int,
    qty: int,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if qty <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    # how many copies are currently issued
    issued_count = db.query(Issue).filter(
        Issue.book_id == book_id
    ).count()

    available = book.total - issued_count

    if qty > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} copies can be removed"
        )

    book.total -= qty
    db.commit()

    return {
        "msg": f"{qty} copies removed successfully",
        "remaining": book.total
    }

