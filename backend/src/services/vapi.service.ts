import Vapi from '@vapi-ai/server-sdk';
import dotenv from 'dotenv';
import { getFriendliCompletion } from './friendli.service';

dotenv.config();

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || '';

if (!VAPI_API_KEY) {
  console.error('Vapi API key missing. Please check your .env file');
}

const vapi = new Vapi(VAPI_API_KEY);

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
      const assistant = await vapi.assistants.create({
        name: 'Waki Morning Assistant',
        model: {
          provider: 'custom-llm',
          model: 'friendli',
          messages: [
            {
              role: 'system',
              content: `You are Waki, a friendly morning companion helping ${context.userName} wake up.
              Current time: ${context.currentTime}
              ${context.weather ? `Weather: ${context.weather.temperature}°C, ${context.weather.description}` : ''}
              
              Your role:
              - Be warm, encouraging, and conversational
              - Help them start their day positively
              - Ask about their plans for the day
              - Offer motivational insights
              - Keep responses concise and natural
              - Remember you're having a voice conversation, so speak naturally`
            }
          ]
        },
        voice: {
          provider: 'eleven-labs',
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
      const assistant = await this.createAssistant(context);
      
      const call = await vapi.calls.create({
        assistantId: assistant.id,
        phoneNumberId: phoneNumber,
        customer: {
          name: context.userName,
        },
      });

      return call;
    } catch (error) {
      console.error('Error creating phone call:', error);
      throw new Error('Failed to initiate call');
    }
  }

  async createWebCall(context: ConversationContext) {
    try {
      // Create or update assistant with context
      const assistant = await this.updateAssistantContext(context);
      
      // Generate a web call token for the frontend
      const webCallUrl = await this.generateWebCallUrl(assistant.id);
      
      return {
        assistantId: assistant.id,
        webCallUrl,
      };
    } catch (error) {
      console.error('Error creating web call:', error);
      throw new Error('Failed to create web call');
    }
  }

  async updateAssistantContext(context: ConversationContext) {
    try {
      // Use existing assistant or create new one
      if (VAPI_ASSISTANT_ID) {
        // Update existing assistant with new context
        const assistant = await vapi.assistants.update(VAPI_ASSISTANT_ID, {
          model: {
            provider: 'custom-llm',
            model: 'friendli',
            messages: [
              {
                role: 'system',
                content: this.generateSystemPrompt(context)
              }
            ]
          },
        });
        return assistant;
      } else {
        return await this.createAssistant(context);
      }
    } catch (error) {
      console.error('Error updating assistant context:', error);
      throw new Error('Failed to update assistant');
    }
  }

  private generateSystemPrompt(context: ConversationContext): string {
    return `You are Waki, a friendly morning companion helping ${context.userName} wake up.
    Current time: ${context.currentTime}
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

  async generateWebCallUrl(assistantId: string): Promise<string> {
    // This would typically generate a secure URL for web-based calling
    // For now, returning a placeholder
    return `https://vapi.ai/embed/${assistantId}`;
  }

  async endCall(callId: string) {
    try {
      await vapi.calls.update(callId, {
        endedReason: 'user-ended',
      });
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  async getCallTranscript(callId: string) {
    try {
      const call = await vapi.calls.get(callId);
      return call.transcript;
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