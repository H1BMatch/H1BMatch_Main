import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const LLAMA3_API_URL =
  process.env.LLAMA3_API_URL || "http://localhost:11434/api/embed";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(LLAMA3_API_URL, {
      model: "llama3.1",
      input: text,
    });

    console.log("Response:", response);
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    

    const embeddings = response.data.embeddings;
    console.log("Embeddings:", embeddings);

    if (!Array.isArray(embeddings) || !Array.isArray(embeddings[0])) {
      throw new Error("Invalid embedding format received from LLaMA3 API.");
    }
    // Flatten the embeddings array
    const embedding = embeddings.flat();
    console.log("Flattened Embedding:", embedding);

    return embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
