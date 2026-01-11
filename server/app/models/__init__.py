from datetime import datetime, UTC
from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class User(SQLModel, table=True):
    __tablename__ = "user"
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    emailVerified: bool
    image: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    records: List["MedicalRecord"] = Relationship(back_populates="user")
    timeline_events: List["TimelineEvent"] = Relationship(back_populates="user")
    health_trends: List["HealthTrend"] = Relationship(back_populates="user")


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


class MedicalRecord(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    file_name: str
    file_type: str
    s3_key: str
    mime_type: str
    processed_at: Optional[datetime] = None
    extracted_images: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    user: User = Relationship(back_populates="records")


class TimelineEvent(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")

    analysis_summary: str
    timeline_summary: str
    analysis_data: List[dict] = Field(default=[], sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    user: User = Relationship(back_populates="timeline_events")


class HealthTrend(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    trend_summary: str
    analysis_data: List[dict] = Field(default=[], sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    user: User = Relationship(back_populates="health_trends")
