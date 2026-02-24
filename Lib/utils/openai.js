import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-small',
  });

  return response.data[0].embedding;
}

export async function generateAIResponse(context, question) {
  const systemPrompt = `You are an AI tutor for an online learning platform. 
You are knowledgeable, helpful, and concise. 
Use the provided course content to answer the user's question.
If the information is not in the provided content, say so clearly.
Keep responses focused and educational.`;

  const userPrompt = `Based on the following course content, please answer this question:

COURSE CONTENT:
${context}

QUESTION: ${question}

Provide a clear, educational answer.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}

export default { createEmbedding, generateAIResponse };
