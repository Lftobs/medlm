from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

# --- Better Auth Tables (Shared) ---

class User(SQLModel, table=True):
    __tablename__ = "user"
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    emailVerified: bool
    image: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    # Relationships
    records: List["MedicalRecord"] = Relationship(back_populates="user")
    narratives: List["AnalysisNarrative"] = Relationship(back_populates="user")

class Session(SQLModel, table=True):
    __tablename__ = "session"
    id: str = Field(primary_key=True)
    userId: str = Field(foreign_key="user.id")
    token: str = Field(unique=True, index=True)
    expiresAt: datetime
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

class Account(SQLModel, table=True):
    __tablename__ = "account"
    id: str = Field(primary_key=True)
    userId: str = Field(foreign_key="user.id")
    accountId: str
    providerId: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    idToken: Optional[str] = None
    accessTokenExpiresAt: Optional[datetime] = None
    refreshTokenExpiresAt: Optional[datetime] = None
    scope: Optional[str] = None
    password: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

class Verification(SQLModel, table=True):
    __tablename__ = "verification"
    id: str = Field(primary_key=True)
    identifier: str
    value: str
    expiresAt: datetime
    createdAt: datetime
    updatedAt: datetime

# --- MedLM Specific Tables ---

class MedicalRecord(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    file_name: str
    file_type: str  # 'pdf', 'image', 'dicom'
    s3_key: str
    mime_type: str
    processed_at: Optional[datetime] = None
    extracted_images: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="records")

class AnalysisNarrative(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    content: dict = Field(default_factory=dict, sa_column=Column(JSON))
    cache_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="narratives")
