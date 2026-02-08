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

    def register(self, data):
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
            # message
            raise ValueError("User already exists")
    def login(self, data):
        user = self.db.query(User).filter(User.email == data["email"]).first()
        if not user or not pwd.verify(data["password"], user.password):
            return None

        token = jwt.encode(
            {
                "id": user.id,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
            },
            JWT_SECRET,
            algorithm="HS256"
        )
        return token, user.role

    def add_book(self, data):
        book = Book(title=data["title"], total=data["total"])
        self.db.add(book)
        self.db.commit()

    def issue_book(self, user_id, book_id):
        issue = Issue(user_id=user_id, book_id=book_id)
        self.db.add(issue)
        self.db.commit()

    def my_books(self, user_id):
        issues = self.db.query(Issue).filter(Issue.user_id == user_id).all()
        return [
            {
                "book_id": i.book_id,
                "days": (datetime.utcnow() - i.issued_at).days
            }
            for i in issues
        ]
