import weaviate, { WeaviateClient, ApiKey } from 'weaviate-client';
import dotenv from 'dotenv';

dotenv.config();

const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

if (!WEAVIATE_URL || !WEAVIATE_API_KEY) {
  console.error('Weaviate configuration missing. Please check your .env file');
}

let client: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (!client && WEAVIATE_URL && WEAVIATE_API_KEY) {
    client = await weaviate.connectToWeaviateCloud(
      WEAVIATE_URL,
      {
        authCredentials: new ApiKey(WEAVIATE_API_KEY),
      }
    );
  }
  
  if (!client) {
    throw new Error('Failed to connect to Weaviate');
  }
  
  return client;
}

export async function initializeSchema() {
  try {
    const client = await getWeaviateClient();
    
    // Check if collection exists
    const collections = await client.collections.listAll();
    const journalExists = collections.some(c => c.name === 'Journal');
    
    if (!journalExists) {
      // Create Journal collection
      await client.collections.create({
        name: 'Journal',
        properties: [
          {
            name: 'userId',
            dataType: 'text',
          },
          {
            name: 'content',
            dataType: 'text',
          },
          {
            name: 'mood',
            dataType: 'text',
          },
          {
            name: 'tags',
            dataType: 'text[]',
          },
          {
            name: 'audioUrl',
            dataType: 'text',
          },
          {
            name: 'createdAt',
            dataType: 'date',
          },
          {
            name: 'sentiment',
            dataType: 'number',
          },
        ],
      });
      
      console.log('✅ Journal collection created in Weaviate');
    } else {
      console.log('✅ Journal collection already exists');
    }
  } catch (error) {
    console.error('Error initializing Weaviate schema:', error);
  }
}

export { WeaviateClient };