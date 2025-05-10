import { generateText } from './ai-instance';

interface ExtractDateTimeInput {
  taskDescription: string;
  currentDate: string;
}

interface ExtractDateTimeOutput {
  dueDate?: string;
  dueTime?: string;
  completed?: boolean;
}

export async function extractDateTime(input: ExtractDateTimeInput): Promise<ExtractDateTimeOutput> {
  const { taskDescription, currentDate } = input;

  // Get current time at the start of the function
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true 
  });

  const prompt = `Extract date and time information from this task description and respond in JSON format only.
Example response format: {"dueDate": "March 15, 2024", "dueTime": "2:00 PM"}

Rules:
- If the description uses words like "today", "tomorrow", or "yesterday":
  - "today" = ${currentDate}
  - "tomorrow" = one day after ${currentDate}
  - "yesterday" = one day before ${currentDate}
- If no year is mentioned, use the year from ${currentDate}
- If no date is found, use today's date (${currentDate})
- If no time is found, use the current time (${currentTime})
- Return only the JSON object, no other text
- Use 12-hour time format with AM/PM
- Use full month names (e.g., "March" instead of "3")

Task Description: ${taskDescription}`;

  try {
    const response = await generateText(prompt);
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim().replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const result = JSON.parse(cleanedResponse);

    // If no date was found, use today's date
    if (!result.dueDate) {
      result.dueDate = currentDate;
    }

    // Always use current time if no time is specified
    result.dueTime = result.dueTime || currentTime;

    return {
      ...result,
      completed: result.completed ?? false
    };
  } catch (error) {
    console.error('Error extracting date and time:', error);
    // Return current date and time as defaults
    return {
      dueDate: currentDate,
      dueTime: currentTime,
      completed: false
    };
  }
} 