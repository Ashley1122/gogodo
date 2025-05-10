import { generateText } from './ai-instance';

interface Task {
  id: number;
  item: string;
  completed: boolean;
  date: string;
}

interface AnswerTaskQueryInput {
  query: string;
  tasks: Task[];
}

interface AnswerTaskQueryOutput {
  answer: string;
}

export async function answerTaskQuery(input: AnswerTaskQueryInput): Promise<AnswerTaskQueryOutput> {
  const { query, tasks } = input;
  
  const prompt = `You are a helpful assistant that answers questions about the user's tasks.

Here are the user's tasks:
${tasks.map(task => `- Description: ${task.item}, Due Date: ${task.date}, Completed: ${task.completed}`).join('\n')}

Question: ${query}

Please provide a helpful and concise answer about the user's tasks.`;

  try {
    const answer = await generateText(prompt);
    return { answer };
  } catch (error) {
    console.error('Error generating answer:', error);
    return {
      answer: 'Sorry, I encountered an error while processing your query. Please try again.'
    };
  }
} 