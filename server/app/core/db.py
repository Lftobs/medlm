from sqlmodel import create_engine, Session, SQLModel
from .config import settings

engine = create_engine(settings.DATABASE_URL)

def init_db():
    """Initialize database tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for database sessions."""
    with Session(engine) as session:
        yield session
