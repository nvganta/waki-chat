import axios from 'axios';

const FRIENDLI_API_KEY = process.env.FRIENDLI_API_KEY;
const FRIENDLI_ENDPOINT = process.env.FRIENDLI_ENDPOINT;
const FRIENDLI_MODEL = process.env.FRIENDLI_MODEL;

if (!FRIENDLI_API_KEY || !FRIENDLI_ENDPOINT || !FRIENDLI_MODEL) {
  throw new Error('Friendli.ai environment variables are not set');
}

export const getFriendliCompletion = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(
      `${FRIENDLI_ENDPOINT}/chat/completions`,
      {
        model: FRIENDLI_MODEL,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${FRIENDLI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const content: unknown = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Friendli returned no text completion');
    }
    return content;
  } catch (error) {
    console.error('Error getting completion from Friendli.ai:', error);
    throw new Error('Failed to get completion from Friendli.ai');
  }
};
