# Waki Chat - AI Morning Companion (Hackathon Enhanced)

## Project Description
An AI-powered morning companion that transforms your wake-up routine into a personalized conversation with journaling, mood tracking, and intelligent voice interactions. Wake up to natural conversations that adapt to your mood, help you reflect on your day, and motivate you to achieve your goals.

## Enhanced Tech Stack for Hackathon
- **Frontend**: React Native (cross-platform mobile app)
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore + **Weaviate** (vector storage for journals)
- **AI/LLM**: ~~OpenAI GPT-4o-mini~~ → **Friendli.ai** (optimized inference)
- **Voice Conversations**: ~~OpenAI Whisper~~ → **Vapi** (real-time voice AI)
- **Text-to-Speech**: OpenAI TTS API / Vapi Voice
- **Integrations**: OpenWeather API, Journal Analytics, Mood Tracking
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging

---

## Phase 1: MVP Enhanced - Intelligent Morning Companion

### Goal
Build an AI-powered morning companion that wakes users with natural voice conversations, captures journal entries, and provides personalized motivation based on mood and past reflections.

### What We're Going to Do
- Implement **Vapi** for natural wake-up conversations instead of simple TTS
- Integrate **Weaviate** for storing and retrieving journal entries as vectors
- Use **Friendli.ai** for fast, cost-effective LLM responses
- Create smart conversation flows with context-aware responses
- Add voice journaling with semantic search capabilities
- Create mood detection and adaptive conversation flows
- Enable natural voice commands and multi-turn dialogues

### Deliverables
1. React Native app with:
   - Alarm setting interface with conversation preferences
   - Journal screen for voice/text entries
   - Mood tracking visualizations
   - Conversation history and insights
2. Backend API with endpoints for:
   - Alarm CRUD operations
   - Journal vector storage/retrieval (Weaviate)
   - AI conversation management (Vapi + Friendli.ai)
   - Weather and contextual data fetching
   - Mood analysis and tracking
3. Smart conversation system with:
   - Morning coaching conversations
   - Journal analysis and insights
   - Mood detection from text/voice
   - Goal tracking dialogues
4. Voice conversation features:
   - Natural wake-up dialogues
   - Voice journaling
   - Interactive morning briefings
5. Personalization engine using journal history

---

## Phase 2: Smart Integration

### Goal
Enhance the alarm with calendar integration, news briefings, and multiple alarm profiles to make mornings more informative.

### What We're Going to Do
- Integrate Google/Apple Calendar to include today's events in the greeting
- Add customizable news topics that users can select
- Implement traffic/commute updates based on calendar locations
- Create different alarm profiles (weekday/weekend/custom)
- Add conversation memory to remember user preferences
- Implement a more sophisticated dialogue system

### Deliverables
1. Calendar integration with OAuth flow
2. News feed integration with topic selection
3. Traffic API integration for commute times
4. Multiple alarm profiles system
5. User preference learning system
6. Enhanced conversation flow with context retention

---

## Phase 3: AI Companion Features

### Goal
Transform the alarm into a full morning AI companion with natural conversations, wellness features, and smart home integration.

### What We're Going to Do
- Implement natural multi-turn conversations
- Add mood detection from voice tone and adapt responses
- Include wellness features (morning meditation, motivational quotes, journaling prompts)
- Integrate with smart home devices (lights, coffee maker, thermostat)
- Add sleep tracking to determine optimal wake times
- Create social features for sharing morning routines
- Implement advanced personalization with ML

### Deliverables
1. Advanced conversation engine with context management
2. Mood detection and adaptive response system
3. Wellness module with:
   - Guided meditation scripts
   - Daily affirmations
   - Journal prompt generation
4. Smart home integration APIs
5. Sleep pattern analysis system
6. Social features for routine sharing
7. ML-based personalization engine

---

## Development Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Write unit tests for critical functions
- Use environment variables for API keys

### Security Considerations
- Secure API key storage
- Encrypted user data
- OAuth 2.0 for third-party integrations
- Rate limiting on API endpoints
- Input validation and sanitization

### Performance Targets
- App launch time < 2 seconds
- Alarm trigger accuracy within 1 second
- TTS response time < 3 seconds
- Offline mode for basic functionality