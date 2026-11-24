import axios from 'axios';
import { wakeUpInstructions } from './wake-style';
import { VapiClient } from '@vapi-ai/server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';


if (!VAPI_API_KEY) {
  console.error('Vapi API key missing. Please check your .env file');
}

const vapi = new VapiClient({ token: VAPI_API_KEY });

interface ConversationContext {
  userName: string;
  weather?: any;
  preferences?: any;
  currentTime: string;
  alarmTime?: string;
}

export class VapiService {
  async createAssistant(context: ConversationContext) {
    try {
      const url = process.env.FRIENDLI_ENDPOINT;
      const model = process.env.FRIENDLI_MODEL;
      if (!VAPI_API_KEY || !url || !model) throw new Error('Vapi/Friendli configuration is missing');
      const assistant = await vapi.assistants.create({
        name: 'Waki Morning Assistant',
        model: {
          provider: 'custom-llm',
          url,
          model,
          messages: [{ role: 'system', content: this.generateSystemPrompt(context) }],
        },
        monitorPlan: { controlEnabled: true },
        voice: {
          provider: '11labs',
          voiceId: 'rachel', // Friendly female voice
          stability: 0.8,
          similarityBoost: 0.8,
        },
        firstMessage: `Good morning ${context.userName}! It's ${context.currentTime}. Time to start your amazing day! How are you feeling this morning?`,
      });

      return assistant;
    } catch (error) {
      console.error('Error creating Vapi assistant:', error);
      throw new Error('Failed to create voice assistant');
    }
  }

  async createPhoneCall(phoneNumber: string, context: ConversationContext) {
    try {
      const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
      if (!phoneNumberId) throw new Error('VAPI_PHONE_NUMBER_ID is required');
      const assistant = await this.createAssistant(context);
      
      const call = await vapi.calls.create({
        assistantId: assistant.id,
        phoneNumberId,
        customer: {
          number: phoneNumber,
          name: context.userName,
        },
      });

      if (!('id' in call)) throw new Error('Expected a single call response');
      return call;
    } catch (error) {
      console.error('Error creating phone call:', error);
      throw new Error('Failed to initiate call');
    }
  }

  async createWebCall(context: ConversationContext) {
    try {
      // Prepare a dedicated assistant; the client must start the actual media session.
      const assistant = await this.updateAssistantContext(context);
      return { assistantId: assistant.id };
    } catch (error) {
      console.error('Error creating web call:', error);
      throw new Error('Failed to create web call');
    }
  }

  async updateAssistantContext(context: ConversationContext) {
    // Never overwrite a shared assistant with one user's personal context.
    return this.createAssistant(context);
  }

  private generateSystemPrompt(context: ConversationContext): string {
    return `You are Waki, a friendly morning companion helping ${context.userName} wake up.
    Current time: ${context.currentTime}
    Wake-up approach: ${wakeUpInstructions(context.preferences?.wakeUpStyle)}
    ${context.alarmTime ? `Alarm was set for: ${context.alarmTime}` : ''}
    ${context.weather ? `Weather: ${context.weather.temperature}°C in ${context.weather.city}, ${context.weather.description}` : ''}
    
    Your personality and approach:
    - Be warm, encouraging, and genuinely interested in their day
    - Help them wake up gently but effectively
    - Ask about their dreams, plans for the day, or how they slept
    - Offer motivational insights based on their responses
    - If they mention feeling tired, acknowledge it and offer encouragement
    - Keep responses concise and conversational (2-3 sentences max)
    - Remember this is a voice conversation, so be natural and engaging
    
    Conversation goals:
    1. Help them feel positive about waking up
    2. Get them talking to become more alert
    3. Set a positive tone for their day
    4. If appropriate, suggest they record a morning journal entry about their thoughts`;
  }

  async endCall(callId: string) {
    const call = await vapi.calls.get(callId);
    if (call.status === 'ended') return;
    const controlUrl = call.monitor?.controlUrl;
    if (!controlUrl) throw new Error('Call control is unavailable');
    await axios.post(controlUrl, { type: 'end-call' }, { timeout: 10000 });
  }

  async getCallTranscript(callId: string) {
    try {
      const call = await vapi.calls.get(callId);
      return call.artifact?.transcript ?? null;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  }

  // Handle webhook events from Vapi
  async handleWebhook(event: any) {
    switch (event.type) {
      case 'call.started':
        console.log('Call started:', event.call.id);
        break;
      case 'call.ended':
        console.log('Call ended:', event.call.id);
        // Could save transcript to journal here
        break;
      case 'message':
        // Handle assistant messages
        break;
      default:
        console.log('Unknown webhook event:', event.type);
    }
  }
}

export const vapiService = new VapiService();