# JanSujhav (People's Priorities) 🗳️

JanSujhav is an AI-powered Citizen Engagement and Constituency Development platform designed to bridge the gap between citizens and their Member of Parliament (MP). The platform enables citizens to submit development proposals, report localized grievances, and rank public priorities. The MP office is equipped with AI-driven analytics, automatic category tagging, translation for regional Indian languages, sentiment analysis, and prioritization scoring.

---

## 🛠️ Architecture & Tech Stack

The application features a modern decoupled architecture:

### Frontend
- **Core Framework**: React 18 & Vite 5 (Fast, optimized client builds)
- **Styling**: Tailwind CSS v4 (A custom utility-first implementation of a "Warm Pastel Minimalist" design system)
- **Data Visualization**: Recharts (Interactive charts for analytics and priority distributions)
- **Icons**: Lucide React (Clean, modern vector icons)
- **Routing**: React Router v6

### Backend & AI Pipeline
- **Server**: Node.js & Express
- **Database**: PostgreSQL (Structured storage for users, submissions, and feedback)
- **AI Core**: Google Gemini API (`@google/generative-ai`) for:
  - Multilingual Translation (Supports 12+ major Indian languages)
  - Automatic Categorization (Roads, Water, Education, Health, Electricity, Sanitation, etc.)
  - Sentiment Analysis
  - Keyword extraction and tagging
- **Authentication**: JWT & Native Google Client OAuth integration
- **Automation**: Node-Cron (Background polling for news updates)

---

## 🎨 Visual Identity & Design System

The platform has been fully modernized using a **Warm Pastel Minimalist** design system defined in Tailwind CSS v4:
- **Palette**: Harmonious brand colors including warm yellows (`#FFF9D2`, `#FFEBCC`) and professional blues (`#BFDDF0`, `#8CC0EB`).
- **Typography**: Unified under the **Inter** sans-serif font family.
- **Aesthetics**: Glassmorphism, card-based layouts, smooth interactive hover transitions, custom microphone pulses, and clear responsive spacing.

---

## 🚀 Key Features

1. **Citizen Proposal Submission Form**:
   - Supports voice dictation (speech-to-text) with dynamic waveform feedback.
   - Automatic geolocation mapping (captures latitude and longitude via browser GPS).
   - Direct image evidence upload.
   - Automatic AI processing upon submission (translates regional languages, categorizes the proposal, assigns sentiment, and extracts keyword tags).

2. **WhatsApp Simulation Portal**:
   - Simulated WhatsApp chat client to demonstrate citizen interaction with the MP office.
   - Supports text, simulated voice message submissions, and image sharing.
   - Responses generated dynamically to reflect MP receipt workflows.

3. **News Feed & Aggregator**:
   - Categorized public announcements and community progress reports.
   - Real-time polling updates and category filters.
   - High-contrast, card-based reading layout.

4. **MP Analytics & Governance Dashboard**:
   - Interactive graphs illustrating proposal counts across categories.
   - **Proposal Ranking Matrix**: Prioritizes public proposals using an automated scoring formula based on engagement, urgency, and category weight.
   - Constituency-based filtering and custom account/language settings.

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database instance
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret_key
   ```
4. Run migrations/start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📸 Tech Stack Visualized

![JanSujhav Tech Stack](img/tech_stack.png)
