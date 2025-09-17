# WakiAlarm: The AI-Powered Talking Alarm Clock

## Overview

WakiAlarm is a next-generation mobile application for iOS and Android that transforms the morning alarm into a personalized, intelligent, and motivating experience. It goes beyond a simple ringtone, acting as an AI-powered personal assistant to help users start their day with purpose. The application features a conversational voice AI, a smart journaling system, and tools for goal setting and progress tracking, all designed to support the user's personal growth journey.

## Core Features

*   **AI Talking Alarm**: Wake up to a friendly and natural conversation with an AI. The assistant can discuss the weather, your daily schedule, or remind you of your goals, providing a gentle and productive start to the day.
*   **Conversational AI Assistant**: A text-based chat interface allows you to interact with the AI throughout the day. Use it for brainstorming ideas, getting advice, or simply having a meaningful conversation.
*   **Smart Journaling**: Capture your thoughts and reflections using either text or voice. The application's AI can analyze journal entries to provide insights, track mood patterns, and help you understand yourself better.
*   **Goal Setting & Tracking**: Define your personal and professional goals within the app. The AI assistant can help you break down large goals into manageable steps and track your progress over time.
*   **Personalized Analytics**: A dedicated analytics screen provides visualizations of your progress. Track your goal completion, journaling consistency, and other key metrics.
*   **Secure Authentication**: User data is kept private and secure with a robust authentication system powered by Firebase.

## Tech Stack

The application is built with a modern and powerful set of technologies to deliver a seamless and intelligent user experience.

#### **Frontend (Mobile App)**

*   **Framework**: React Native
*   **Language**: TypeScript
*   **Navigation**: React Navigation
*   **Authentication**: Firebase Authentication
*   **API Communication**: Axios

#### **Backend (Server)**

*   **Framework**: Node.js with Express.js
*   **Language**: TypeScript
*   **Database**: Weaviate (Vector Database)
*   **AI & Machine Learning**:
    *   **OpenAI**: Powers the natural language understanding and generation for the text-based AI assistant.
    *   **Vapi AI**: Drives the real-time, conversational voice AI for the talking alarm feature.
*   **Authentication**: Firebase Admin SDK for verifying user identity.
*   **Scheduled Tasks**: `node-cron` is used to reliably trigger alarms and other scheduled events.

## Architecture

WakiAlarm uses a robust client-server architecture:

1.  **Client (React Native App)**: This is the mobile application that the user interacts with. It handles all UI and user input, communicating with the backend via a REST API.
2.  **Server (Node.js/Express)**: The server acts as the central hub of the application. It contains all the core business logic, processes API requests, and orchestrates interactions between the various third-party services.
3.  **Third-Party Services**:
    *   **Firebase**: Manages user accounts and authentication securely.
    *   **Vapi AI & OpenAI**: These services provide the cutting-edge AI capabilities that make the application intelligent and interactive.
    *   **Weaviate**: This vector database stores user data, such as journal entries, enabling powerful semantic search and retrieval. This allows the AI to have highly context-aware and personalized conversations.

## Getting Started

To run the project locally, you will need to set up both the frontend and backend services.

#### **Backend Setup**

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create a .env file and add your API keys for Firebase, OpenAI, Vapi, etc.
# (See .env.example for required variables)

# 4. Run the development server
npm run dev
```

#### **Frontend Setup**

```bash
# 1. Navigate to the frontend directory
cd frontend/WakiAlarm

# 2. Install dependencies
npm install

# 3. For iOS, install CocoaPods
npx pod-install

# 4. Run the application
# For iOS:
npm run ios

# For Android:
npm run android
```
