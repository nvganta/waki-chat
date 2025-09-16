# Waki Chat Hackathon - Implementation Game Plan

## 🎯 Mission
Transform the basic Waki Alarm app into an intelligent morning companion with natural voice conversations, journaling, and personalized AI coaching.

---

## 📋 Pre-Build Checklist (Do This First!)

### 1. Get Your API Keys
You need to create accounts and get API keys from:

- [ ] **Weaviate Cloud** - https://console.weaviate.cloud/
  - Sign up for free tier
  - Create a cluster
  - Get your URL and API key
  
- [ ] **Vapi** - https://dashboard.vapi.ai/
  - Sign up
  - Create an assistant
  - Get your API key and assistant ID
  
- [ ] **Friendli.ai** - https://suite.friendli.ai/
  - Sign up for free tier
  - Get your API key
  - Note the model you want to use
  

### 2. Update Your .env File
Copy `.envexample` to `.env` and fill in all the new keys.

---

## 🏗️ Build Order (Follow This Sequence)

### Step 1: Install Dependencies (5 mins)
```bash
# Backend packages
cd backend
npm install weaviate-ts-client @vapi-ai/server-sdk friendliai axios

# Frontend packages  
cd ../frontend
npm install react-native-webrtc @daily-co/react-native-daily-js
```

### Step 2: Friendli.ai Integration (30 mins)
**Why first?** Quick drop-in replacement for OpenAI, immediate performance boost.

1. Create `backend/src/services/friendli.service.ts`
2. Replace OpenAI calls in `ai.service.ts`
3. Test with existing alarm flow
4. Benchmark response times

### Step 3: Weaviate Setup (1 hour)
**Why second?** Foundation for journaling features.

1. Create `backend/src/config/weaviate.ts` 
2. Define journal schema
3. Create `backend/src/services/journal.service.ts`
4. Add journal endpoints to routes
5. Test vector storage and retrieval

### Step 4: Vapi Voice Integration (2 hours)
**Why third?** Most visible user-facing enhancement.

1. Create `backend/src/services/vapi.service.ts`
2. Set up Vapi assistant configuration
3. Replace voice command system in frontend
4. Add WebSocket connection for real-time voice
5. Update AlarmDetailScreen for conversations
6. Test full conversation flow

### Step 5: Frontend Journal Screen (1 hour)
**Why fourth?** Completes the journaling feature.

1. Create `frontend/src/screens/JournalScreen.tsx`
2. Add to navigation tabs
3. Implement voice recording UI
4. Add journal list view
5. Create mood selection interface
6. Test full journaling flow

### Step 6: Integration & Polish (1 hour)
1. Connect all services end-to-end
2. Add error handling and fallbacks
3. Optimize performance
4. Create demo data
5. Prepare demo script

---

## 🚀 Quick Start Commands

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm start

# Run iOS
npm run ios

# Run Android  
npm run android
```

---

## 🎮 Feature Priority Matrix

### Must Have (Core Demo)
- ✅ Vapi voice conversations
- ✅ Journal storage in Weaviate
- ✅ Friendli.ai for fast responses
- ✅ Smart prompt engineering for conversations

### Should Have (If Time)
- ⭐ Voice journaling
- ⭐ Mood visualization
- ⭐ Semantic search

### Nice to Have (Stretch)
- 💫 Goal tracking
- 💫 Analytics dashboard
- 💫 Social sharing

---

## 🧪 Testing Strategy

### After Each Integration
1. Test in isolation first
2. Test with existing features
3. Test error cases
4. Document any issues

### End-to-End Test Flow
1. Create new user account
2. Set an alarm with conversation preference
3. Trigger test alarm
4. Have a conversation with Vapi
5. Create a journal entry
6. Search for related entries
7. View mood analytics

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

**Vapi not connecting?**
- Check WebSocket URL
- Verify API key and assistant ID
- Check network permissions

**Weaviate queries failing?**
- Verify cluster is running
- Check schema creation
- Ensure proper vectorization

**Friendli.ai slow responses?**
- Check model selection
- Verify endpoint URL
- Consider streaming responses


---

## 📊 Success Metrics

### Performance Targets
- Voice response latency: < 1 second
- LLM response time: < 2 seconds  
- Journal search: < 500ms
- App startup: < 3 seconds

### Demo Success Criteria
- [ ] Natural voice conversation works
- [ ] Journal entries save and retrieve
- [ ] Mood detection functions
- [ ] Agents provide relevant responses
- [ ] No crashes during 5-minute demo

---

## 🎬 Demo Script Outline

1. **Opening** (30 sec)
   - "Waki Chat transforms your morning routine into a personalized AI conversation"

2. **Current Problem** (30 sec)
   - Show traditional jarring alarm
   - Explain lack of personalization

3. **Solution Demo** (3 min)
   - Trigger alarm with Vapi conversation
   - Natural dialogue about the day
   - Voice journal entry
   - Show semantic search finding patterns
   - Display mood insights

4. **Technical Innovation** (1 min)
   - Explain Vapi for natural voice
   - Show Weaviate vector search
   - Highlight Friendli.ai speed
   - Describe personalization through journal analysis

5. **Closing** (30 sec)
   - Future vision
   - Call to action

---

## 📝 Final Notes

- **Keep the existing app functional** - Don't break what's working
- **Use fallbacks** - If new service fails, fall back to OpenAI
- **Focus on the demo** - Polish what you'll show, not everything
- **Document as you go** - Update Output.md with progress
- **Test frequently** - Don't wait until the end
- **Have fun!** - This is a hackathon, experiment and learn

---

## When You're Ready

Say "Let's build!" and we'll start with Step 1!