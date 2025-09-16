# 🌟 Waki Chat - AI-Powered Morning Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-v0.73-blue)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org/)

Transform your morning routine with Waki Chat - an intelligent alarm clock that wakes you up with personalized AI conversations, mood tracking, and goal management.

## ✨ Features

### Core Features
- 🎙️ **AI Voice Conversations** - Natural morning conversations powered by Vapi
- 📝 **Smart Journaling** - Voice and text journaling with automatic mood analysis
- 🎯 **Goal Tracking** - Set and track personal goals with AI-powered suggestions
- 📊 **Analytics Dashboard** - Visualize mood trends and track progress
- 🔍 **Semantic Search** - Find journal entries using natural language (Weaviate)
- ⚡ **Fast AI Responses** - Optimized with Friendli.ai for <2s response times
- 🔒 **Secure Authentication** - Firebase-based user management
- ⏰ **Smart Alarms** - AI-generated wake-up messages with weather integration

## 🏗️ Tech Stack

- **Frontend**: React Native, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **AI/ML**: 
  - OpenAI (TTS/STT)
  - Friendli.ai (Fast LLM responses)
  - Vapi (Voice conversations)
- **Database**: 
  - Firebase Firestore (User data)
  - Weaviate (Vector DB for semantic search)
- **Authentication**: Firebase Auth
- **APIs**: OpenWeather API

## 📋 Prerequisites

- Node.js v18+ and npm
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/environment-setup))
- Xcode (for iOS) or Android Studio (for Android)
- CocoaPods (for iOS)

### Required API Keys

You'll need to create accounts and obtain API keys from:

1. **OpenAI** - [platform.openai.com](https://platform.openai.com)
2. **Firebase** - [console.firebase.google.com](https://console.firebase.google.com)
3. **Friendli.ai** - [suite.friendli.ai](https://suite.friendli.ai)
4. **Weaviate Cloud** - [console.weaviate.cloud](https://console.weaviate.cloud)
5. **Vapi** - [dashboard.vapi.ai](https://dashboard.vapi.ai)
6. **OpenWeather** - [openweathermap.org/api](https://openweathermap.org/api)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/nvganta/waki-chat.git
cd waki-chat
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .envexample .env

# Edit .env and add your API keys
nano .env  # or use your favorite editor

# Start the backend server
npm run dev
```

The backend will start on http://localhost:3000

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to React Native app
cd frontend/WakiAlarm

# Install dependencies
npm install

# iOS only: Install pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start
```

### 4. Run the App

In another terminal:

```bash
# For iOS
npm run ios

# For Android
npm run android
```

## 🔧 Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081

# OpenAI
OPENAI_API_KEY=your_openai_key

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Friendli.ai
FRIENDLI_API_KEY=your_friendli_key
FRIENDLI_ENDPOINT=https://inference.friendli.ai/v1
FRIENDLI_MODEL=meta-llama-3.1-8b-instruct

# Weaviate
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your_weaviate_key

# Vapi
VAPI_API_KEY=your_vapi_key

# Weather
OPENWEATHER_API_KEY=your_weather_key
```

## 📚 API Documentation

### Alarms
- `POST /api/alarms` - Create new alarm
- `GET /api/alarms` - Get all user alarms
- `GET /api/alarms/:id` - Get specific alarm
- `PUT /api/alarms/:id` - Update alarm
- `DELETE /api/alarms/:id` - Delete alarm

### Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences

### AI Features
- `POST /api/ai/wake-message` - Generate wake-up message
- `POST /api/ai/generate-audio` - Convert text to speech
- `POST /api/ai/voice-command` - Process voice command
- `GET /api/ai/test-alarm` - Test alarm with audio

## Testing

1. Create a test account in the app
2. Set your location in Settings
3. Create an alarm
4. Use "Test Alarm" in Settings to preview the wake-up experience

## Project Structure

```
waki-alarm/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── index.ts       # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── screens/       # React Native screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API and Firebase services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── App.tsx
│   └── package.json
├── Project.md             # Phase requirements
└── Output.md              # Implementation progress
```

## Next Steps (Phase 2 & 3)

- Calendar integration
- News briefings
- Multiple alarm profiles
- Advanced conversation features
- Wellness features
- Smart home integration

## License

MIT