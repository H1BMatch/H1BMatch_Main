
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const LLAMA3_API_URL = process.env.LLAMA3_API_URL || 'http://localhost:11434/api/embeddings';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(LLAMA3_API_URL, {
      model: 'llama3.1',
      prompt: text,
    });

    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }

    const embedding = response.data.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format received from LLaMA3 API.');
    }

    return embedding;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.data || error.message);
    } else {
      console.error('Error generating embedding:', error.message || error);
    }
    throw new Error('Failed to generate resume embedding.');
  }
}

