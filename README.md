# MedLM

A modern medical document analysis platform powered by AI that helps users manage, analyze, and understand their health records.

🌐 **Live Demo**: [https://medlm.vercel.app](https://medlm.vercel.app)

## Overview

MedLM is a full-stack application that combines React with TanStack Router on the frontend and FastAPI with Python on the backend to provide intelligent medical document analysis. The platform processes various medical file formats (DICOM, PDF, DOCX) and extracts meaningful insights using Google's Gemini AI and advanced NLP techniques.

## Features

- 📄 **Multi-Format Support**: Upload and process DICOM, PDF, and DOCX medical files
- 🤖 **AI-Powered Analysis**: Automatic document classification and summarization using Google Gemini
- 💬 **Interactive Chat**: Chat interface to query your medical records with context-aware responses
- 📊 **Health Trends**: Visualize health metrics and trends over time with interactive charts
- 📅 **Timeline View**: Chronological view of your medical history and events
- 🔐 **Secure Authentication**: Google OAuth integration with Better Auth
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS and Framer Motion
- ⚡ **Real-time Updates**: Server-sent events for live progress updates

## Tech Stack

### Frontend
- **Framework**: React 19 with TanStack Start (SSR)
- **Routing**: TanStack Router
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts & D3.js
- **Authentication**: Better Auth
- **Build Tool**: Vite
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI
- **ORM**: SQLModel (SQLAlchemy)
- **Database**: PostgreSQL
- **Task Queue**: Celery with Redis
- **AI/ML**:
  - Google Generative AI (Gemini)
  - DSPy for structured LLM outputs
  - Sentence Transformers for embeddings
  - Mem0 for memory management
- **File Processing**:
  - PyDICOM for DICOM files
  - PyMuPDF for PDF extraction
  - python-docx for Word documents
- **Language**: Python 3.13

## Project Structure

```
medlm/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── routes/     # TanStack Router routes
│   │   ├── components/ # Reusable UI components
│   │   └── styles.css  # Global styles
│   └── package.json
│
├── server/              # Backend FastAPI application
│   ├── app/
│   │   ├── api/        # API routes
│   │   ├── core/       # Core configurations
│   │   ├── models/     # Database models
│   │   ├── services/   # Business logic services
│   │   └── main.py     # Application entry point
│   ├── alembic/        # Database migrations
│   └── pyproject.toml
│
└── scripts/            # Utility scripts
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.13+ (for backend)
- **PostgreSQL** database
- **Redis** server (for Celery task queue)
- **Google Cloud** account (for Gemini API)
- **uv** package manager ([installation guide](https://github.com/astral-sh/uv))

### Environment Setup

#### Backend Configuration

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/medlm
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   BETTER_AUTH_SECRET=your_better_auth_secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

#### Frontend Configuration

Configure your client environment with the appropriate API endpoints and authentication settings.

### Installation & Running

#### Backend

1. Install dependencies using uv:
   ```bash
   cd server
   uv sync
   ```

2. Run database migrations:
   ```bash
   uv run alembic upgrade head
   ```

3. Start the server (runs FastAPI + Celery worker):
   ```bash
   ./start_server.sh
   ```

   Or manually:
   ```bash
   # Start Celery worker
   uv run celery -A app.core.celery_app worker -l info -P gevent

   # Start FastAPI server
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

#### Frontend

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Building for Production

#### Frontend
```bash
cd client
npm run build
```

#### Backend
The backend uses uvicorn with production-ready settings. Deploy using your preferred hosting solution (Docker, AWS, etc.).

## Available Routes

The application includes the following routes:

- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - Main dashboard
- `/dashboard/records` - Medical records list
- `/dashboard/records/:recordId` - Individual record details
- `/dashboard/chat` - AI chat interface
- `/dashboard/charts` - Health data visualizations
- `/dashboard/timeline` - Medical history timeline
- `/dashboard/trends` - Health trends analysis

## Key Features Explained

### Document Processing
The platform supports multiple medical document formats:
- **DICOM**: Medical imaging files (X-rays, CT scans, MRI)
- **PDF**: Lab reports, prescriptions, medical certificates
- **DOCX**: Medical notes and reports

Files are processed asynchronously using Celery, with real-time progress updates.

### AI Analysis
Using Google's Gemini model and DSPy for structured outputs:
- Automatic document classification
- Intelligent summarization
- Context-aware chat responses
- Health trend extraction

### Memory System
The Mem0 integration provides:
- Persistent memory of medical history
- Context-aware responses in chat
- Personalized health insights

## Development

### Code Quality

#### Frontend
```bash
npm run lint      # Lint with Biome
npm run format    # Format code
npm run check     # Check code quality
npm run test      # Run tests
```

#### Backend
```bash
uv run pytest     # Run tests
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [TanStack Router](https://tanstack.com/router)
- AI capabilities by [Google Gemini](https://ai.google.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is a medical document analysis tool for personal use. Always consult with healthcare professionals for medical advice.
Data used: Case courtesy of Zeeshan Ghias Khan, <a href="https://radiopaedia.org/?lang=us">Radiopaedia.org</a>. From the case <a href="https://radiopaedia.org/cases/66041?lang=us">rID: 66041</a>
