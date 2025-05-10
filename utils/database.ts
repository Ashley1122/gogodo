import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('todos.db');

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        item TEXT NOT NULL, 
        completed BOOLEAN DEFAULT 0,
        date TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/**
 * Sorts todos with manual date parsing to handle custom format
 */
function sortTodosByProximity(todos: Array<{ id: number, item: string, completed: boolean, date: string }>) {
  // Manual date parser for format: "May 10, 2025 at 10:53 PM"
  function parseCustomDate(dateString: string) {
    try {
      // Regular expression to extract components
      const regex = /(\w+)\s+(\d+),\s+(\d+)\s+at\s+(\d+):(\d+)\s+(\w+)/;
      const match = dateString.match(regex);
      
      if (!match) {
        console.warn("Date format doesn't match expected pattern:", dateString);
        return new Date(0);
      }
      
      const [_, month, day, year, hours, minutes, period] = match;
      
      // Convert month name to month index (0-11)
      const monthNames = {
        "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
        "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
      };
      
      const monthIndex = monthNames[month as keyof typeof monthNames];
      if (monthIndex === undefined) {
        console.warn("Invalid month name:", month);
        return new Date(0);
      }
      
      // Parse other components
      let parsedDay = parseInt(day, 10);
      const parsedYear = parseInt(year, 10);
      let parsedHours = parseInt(hours, 10);
      const parsedMinutes = parseInt(minutes, 10);
      
      // Adjust hours for PM
      if (period.toUpperCase() === "PM" && parsedHours < 12) {
        parsedHours += 12;
      }
      // Adjust for 12 AM
      if (period.toUpperCase() === "AM" && parsedHours === 12) {
        parsedHours = 0;
      }
      
      // Create date object
      const date = new Date(parsedYear, monthIndex, parsedDay, parsedHours, parsedMinutes, 0);
      return date;
    } catch (e) {
      console.error("Failed to parse date:", dateString, e);
      return new Date(0);
    }
  }
  
  const result = [...todos].sort((a, b) => {
    // Handle potentially invalid completed values by coercing to boolean
    const aCompleted = Boolean(a.completed);
    const bCompleted = Boolean(b.completed);
    
    // FIRST PRIORITY: Uncompleted todos come before completed ones
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }
    
    // SECOND PRIORITY: Sort by date
    const dateA = parseCustomDate(a.date);
    const dateB = parseCustomDate(b.date);
    
    return dateA - dateB;
  });
  
  return result;
}

const addTodo = async (item: string, date: string) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO todos (item, completed, date) VALUES (?, 0, ?)',
      [item, date]
    );
    return result.lastInsertRowId as number;
  } catch (error) {
    console.error('Error adding todo:', error);
    throw error;
  }
};

const getAllTodos = async () => {
  try {
    const todos = await db.getAllAsync('SELECT * FROM todos');
    const sortedTodos = sortTodosByProximity(todos as Array<{ id: number, item: string, completed: boolean, date: string }>);
    return sortedTodos.map((todo: any) => ({
      ...todo,
      completed: Boolean(todo.completed),
      date: todo.date.toString()  // Explicitly convert to string
    }));
  } catch (error) {
    console.error('Error getting todos:', error);
    throw error;
  }
};

const toggleTodo = async (id: number) => {
  try {
    // Toggle the todo's completed status
    await db.runAsync(
      'UPDATE todos SET completed = NOT completed WHERE id = ?',
      id
    );
    
    // Fetch and return all todos, sorted
    const todos = await getAllTodos();
    return todos;
  } catch (error) {
    console.error('Error toggling todo:', error);
    throw error;
  }
};

const deleteTodo = async (id: number) => {
  try {
    await db.runAsync('DELETE FROM todos WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

const search = async (query: string) => {
  try {
    // Convert Date to ISO string if it's a Date object
    const searchQuery = `%${query.toLowerCase()}%`;
    
    const todos = await db.getAllAsync(
      `SELECT * FROM todos WHERE 
        LOWER(item) LIKE ?`,
      [searchQuery]
    );

    // If no results found, return all todos
    const result = todos.length > 0 
      ? todos 
      : await db.getAllAsync('SELECT * FROM todos');
    return sortTodosByProximity(result as Array<{ id: number, item: string, completed: boolean, date: string }>).map((todo: any) => ({
      ...todo,
      completed: Boolean(todo.completed),
      date: todo.date.toString()  // Explicitly convert to string
    }));
  }
  catch (error) {
    console.error('Error searching todo:', error);
    throw error;
  }
}

export default {
  initDatabase,
  addTodo,
  getAllTodos,
  toggleTodo,
  deleteTodo,
  search
};