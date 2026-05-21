# VedaAI - AI Assessment Creator

VedaAI is an advanced, premium AI-powered Assessment Creator designed for educators. It enables teachers to instantly generate structured question papers (MCQs, Short Answers, Long Answers, and Very Long Answers), stream live WebSocket logs of the generation progress, view interactive class performance analytics, toggle between light and dark modes, and manage customized teacher profiles.

## Architecture Overview

The system follows a decoupling-first model using a Next.js Frontend, an Express Backend API, a Redis-backed BullMQ job queue, and a MongoDB / local JSON fallback store integrated with the Google Gemini AI API for intelligent paper generation.

### System Architecture Flow

```mermaid
graph TD
    %% Frontend Group
    subgraph Frontend ["Next.js Frontend (React + Zustand)"]
        UI["User Interface (Dashboard, Forms, Output)"]
        WSClient["WebSocket Client (Real-time logs)"]
        StoreUser["Zustand User Store"]
        StoreAss["Zustand Assignment Store"]
    end

    %% Backend Group
    subgraph Backend ["Express.js Backend API & Socket Server"]
        Express["Express App (API Endpoints)"]
        WSServer["WebSocket Server"]
        RouteUser["User Routes (/api/profile)"]
        RouteAss["Assignment Routes (/api/assignments)"]
        BullQueue["BullMQ Queue Handler"]
    end

    %% Worker Group
    subgraph Worker ["BullMQ Worker Process"]
        JobProcessor["Worker Job Processor"]
        GeminiService["Gemini AI Service"]
        PDFGen["PDF Generator (PDFKit)"]
    end

    %% Database Group
    subgraph Storage ["Storage & Message Broker"]
        Redis["Redis Message Broker (Queue & Pub/Sub)"]
        MongoDB["MongoDB (User & Assignment Schemas)"]
        MockDB["Mock JSON Fallback File Database"]
    end

    %% Interactions
    UI --> StoreUser
    UI --> StoreAss
    
    StoreUser -- "HTTP GET/PUT" --> RouteUser
    StoreAss -- "HTTP GET/POST/DELETE" --> RouteAss
    
    RouteUser --> MongoDB
    RouteUser --> MockDB
    RouteAss --> MongoDB
    RouteAss --> MockDB
    
    RouteAss -- "Job Push" --> BullQueue
    BullQueue -- "Queue Pub/Sub" --> Redis
    
    Redis -- "Fetch Jobs" --> JobProcessor
    JobProcessor -- "Stream Progress Logs" --> Redis
    
    JobProcessor -- "Prompt API" --> GeminiService
    JobProcessor -- "Build Paper" --> PDFGen
    PDFGen --> MongoDB
    PDFGen --> MockDB
    
    WSServer -- "Subscriptions" --> Redis
    WSClient <--> WSServer
```

### Flow Breakdown:
1. **Form Submission**: The teacher submits the assignment requirements (subject, class, question types, time limit) via the UI.
2. **Database & Queueing**: The API writes a new pending record to MongoDB (or mock fallback `mock_db.json`) and triggers a generation job on the Redis-backed BullMQ.
3. **WebSocket Handshake**: The frontend connects to the WebSocket server subscribing to the assignment ID room to receive real-time updates.
4. **AI Generation (Gemini)**: The queue worker picks up the job, constructs a structured prompt, invokes the Google Gemini API (using the `gemini-2.5-flash` model), and processes the response.
5. **Real-time Log Stream**: Every incremental step (loading context, generating MCQs, formatting sections) is published to the Redis channel and sent via WebSockets to the frontend.
6. **PDF Creation**: The worker compiles the generated sections into a PDF using PDFKit and updates the assignment status to `completed`.

## Features

- **AI Question Generation Form**: Set question types (including MCQ, Short Answer, Long Answer, and the newly added Very Long Answer), counts, marks per question, allowed time, and specify custom additional instructions or upload reference materials.
- **Support for Basic Subjects**: Added drop-down selectors and template support for Mathematics, Science, English, Social Studies, Computers, and Hindi.
- **WebSocket Streaming Log Terminal**: Displays live worker processing progress and logging logs in a vintage terminal widget.
- **Premium Glassmorphic Loader**: Redesigned generation overlay with a glassmorphism theme, progress percentage tracker, and responsive streaming log container that adapts to both light and dark backgrounds.
- **Global Dark Mode**: Fully integrated layout color tokens with a toggle button in the header and persistent state saved via `localStorage`. All input controls, buttons, checkboxes, dialog boxes, and the exam page preview adapt to the selected theme.
- **Dynamic Teacher Profile & Settings**: Edit full name, school details, and branch directly in the app. Updates the sidebar card and main welcome greeting dynamically.
- **Separated Assignments Dashboard**: A standalone `/assignments` page equipped with instant fuzzy-search, card option dropdowns ("View Paper", "Delete"), status tagging, and pagination cards.
- **Interactive Metrics & Analytics Widgets**:
  - **Submission Rate Gauge**: Rendered as an SVG path gauge tracking class completion with detail modals and student reminders.
  - **Time Saved Counter**: Estimates total saved hours by using AI, complete with breakdown modals.
  - **Badge Gamification System**: Floating badge triggers (Certified Educator, Fast Grader) on the dashboard avatar profile.
- **Toggleable Answer Keys**: Inside the assignment detail page, teachers can toggle answer keys visibility, print or download PDFs.

## Requirements and Prerequisites

### Softwares Required:
- **Node.js** (v18.0.0 or higher)
- **NPM** (v9.0.0 or higher)
- **Docker & Docker Compose** (Recommended for local Redis and MongoDB services)

### API Credentials:
- **Google Gemini API Key**: Obtain one from Google AI Studio.

## Configuration Setup

### Backend Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=AIzaSyDFCf...YourGeminiAPIKeyHere
```
*Note: If MongoDB or Redis are not detected, the backend will automatically enter Mock/Memory Fallback Mode, storing data locally in `backend/mock_db.json`/`mock_user.json` and running generation tasks synchronously in memory.*

### Frontend Environment Configuration
Create a `.env` file in the `frontend/` directory (optional, default endpoints are set to localhost):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

## How to Run the Project

### Step 1: Initialize MongoDB and Redis (via Docker)
To start isolated MongoDB and Redis databases easily, execute the following command in the root folder (or launch them on your system):

```bash
# Spin up MongoDB and Redis in the background
docker run -d --name veda-mongodb -p 27017:27017 mongo:latest
docker run -d --name veda-redis -p 6379:6379 redis:latest
```

*To verify they are running, type `docker ps`.*

### Step 2: Install Dependencies & Run Backend
Open a terminal in the `/backend` directory:
```bash
# Install packages
npm install

# Start the compilation watcher and server
npm run dev
```
*The backend API server will list on `http://localhost:5000`.*

### Step 3: Install Dependencies & Run Frontend
Open a separate terminal in the `/frontend` directory:
```bash
# Install packages
npm install

# Launch the Next.js development server
npm run dev
```
*Open your browser and visit `http://localhost:3000` to interact with the application.*

## Project Structure

```
vedaai-assignment/
├── backend/
│   ├── src/
│   │   ├── config/       # Connection parameters & fallbacks
│   │   ├── models/       # mongoose database schemas
│   │   ├── queues/       # BullMQ setup & workers
│   │   ├── routes/       # Express user & assignment routes
│   │   ├── services/     # Gemini AI & PDFkit services
│   │   ├── websocket/    # ws socket server implementation
│   │   └── index.ts      # Server entry point
│   ├── mock_db.json      # File database fallback (Assignments)
│   ├── mock_user.json    # File database fallback (User Profile)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── assignments/  # Searchable Grid Page
│   │   │   ├── assignment/   # Detailed view of paper & keys
│   │   │   ├── create/       # Toolkit configuration form
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx      # Welcome Analytics Home Page
│   │   ├── components/       # Header, Sidebar, Log Terminal
│   │   └── store/            # Zustand state containers
│   ├── package.json
│   └── tsconfig.json
└── README.md                 # Project Documentation
```

## Verification and Building

To verify code safety and compile output:

### Backend Build Check
```bash
cd backend
npm run build
```

### Frontend Build Check
```bash
cd frontend
npm run build
```
Both projects compile with zero linter or TypeScript errors.
