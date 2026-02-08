from models import User, Book, Issue
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from config import JWT_SECRET, JWT_EXPIRE_MIN
from sqlalchemy.exc import IntegrityError

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LibraryService:
    def __init__(self, db):
        self.db = db

    # ======================
    # REGISTER
    # ======================
    def register(self, data: dict) -> None:
        user = User(
            name=data["name"],
            email=data["email"],
            password=pwd.hash(data["password"]),
            role=data["role"]
        )

        try:
            self.db.add(user)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("User already exists")

    # ======================
    # LOGIN (FIXED)
    # ======================
    def login(self, data: dict) -> dict:
        user = self.db.query(User).filter(User.email == data["email"]).first()

        if not user or not pwd.verify(data["password"], user.password):
            raise ValueError("Invalid email or password")

        token = jwt.encode(
            {
                "id": user.id,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
            },
            JWT_SECRET,
            algorithm="HS256"
        )

        return {
            "token": token,
            "role": user.role,
            "user_id": user.id
        }

    # ======================
    # ADD BOOK (ADMIN)
    # ======================
    def add_book(self, data: dict) -> None:
        book = Book(
            title=data["title"],
            total=data["total"]
        )
        self.db.add(book)
        self.db.commit()

    # ======================
    # ISSUE BOOK (ADMIN / STUDENT)
    # ======================
    def issue_book(self, user_id: int, book_id: int) -> None:
        issue = Issue(
            user_id=user_id,
            book_id=book_id
        )
        self.db.add(issue)
        self.db.commit()

    # ======================
    # MY BOOKS (STUDENT)
    # ======================
    def my_books(self, user_id: int) -> list[dict]:
        issues = self.db.query(Issue).filter(
            Issue.user_id == user_id
        ).all()

        return [
            {
                "book_id": i.book_id,
                "days": (datetime.utcnow() - i.issued_at).days
            }
            for i in issues
        ]
