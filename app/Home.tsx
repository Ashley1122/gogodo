import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Animated, Alert } from "react-native";
import * as Updates from 'expo-updates';
import List from "../components/List";
import Ionicon from "@expo/vector-icons/Ionicons";
import Database from "../utils/database";
import { answerTaskQuery } from "../utils/task-query";
import { extractDateTime } from "../utils/date-extractor";
import { NotificationUtils } from "../utils/notifications";

const Home = () => {
  const [todos, setTodos] = React.useState<Array<{
    id: number,
    item: string,
    completed: boolean,
    date: string
  }>>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [todo, setTodo] = React.useState<string>("");
  const [aiQuery, setAiQuery] = React.useState<string>("");
  const [aiResponse, setAiResponse] = React.useState<string>("");
  const [isAiModalVisible, setIsAiModalVisible] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Expo Updates function
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setLoading(true);
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      Alert.alert('Update Error', `Error fetching latest Expo update: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onFetchUpdateAsync();
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        await Database.initDatabase();
        await fetchTodos();
        setLoading(false);
      } catch (error) {
        console.error("Database initialization error", error);
        setLoading(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Initialize notifications
        const cleanup = await NotificationUtils.initializeNotifications();

        // Optional: return cleanup function for component unmount
        return cleanup;
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setIsProcessing(true);
    setAiResponse("");

    // Direct search handling
    if (aiQuery.toLowerCase().startsWith('search ')) {
      const searchTerm = aiQuery.slice(7).trim(); // Remove 'search ' and trim
      try {
        const searchResults = await Database.search(searchTerm);
        if (searchResults.length > 0) {
          console.log(searchResults);
          setTodos(searchResults as Array<{ id: number, item: string, completed: boolean, date: string }>);
          setAiResponse(`Found ${searchResults.length} todo(s) matching "${searchTerm}"`);
        } else {
          setAiResponse(`No todos found matching "${searchTerm}"`);
        }
        setIsProcessing(false);
        return;
      } catch (error) {
        console.error("Search error", error);
        setAiResponse("Sorry, I couldn't perform the search.");
        setIsProcessing(false);
        return;
      }
    }

    if (aiQuery.toLowerCase().startsWith('find ')) {
      const searchTerm = aiQuery.slice(5).trim(); // Remove 'find ' and trim
      try {
        const searchResults = await Database.search(searchTerm);
        if (searchResults.length > 0) {
          console.log(searchResults);
          setTodos(searchResults as Array<{ id: number, item: string, completed: boolean, date: string }>);
          setAiResponse(`Found ${searchResults.length} todo(s) matching "${searchTerm}"`);
        } else {
          setAiResponse(`No todos found matching "${searchTerm}"`);
        }
        setIsProcessing(false);
        return;
      } catch (error) {
        console.error("Search error", error);
        setAiResponse("Sorry, I couldn't perform the search.");
        setIsProcessing(false);
        return;
      }
    }

    // Existing AI query handling
    try {
      const response = await answerTaskQuery({
        query: aiQuery,
        tasks: todos
      });
      setAiResponse(response.answer);
    } catch (error) {
      console.error("Error querying AI", error);
      setAiResponse("Sorry, I couldn't process your query at this time.");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleAddTodo = async () => {
    try {
      // Get current date in the desired format
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Extract date and time from the todo description
      const dateTimeInfo = await extractDateTime({
        taskDescription: todo,
        currentDate
      });

      const formattedDate = `${dateTimeInfo.dueDate} at ${dateTimeInfo.dueTime}`;
      const newId = await Database.addTodo(todo, formattedDate);
      
      // Create todo object
      const newTodo = { 
        id: newId, 
        item: todo, 
        completed: false, 
        date: formattedDate
      };

      // Update local todos list
      setTodos([...todos, newTodo]);
      
      // Schedule notification
      await NotificationUtils.scheduleTodoNotification({
        id: newId,
        item: todo,
        date: formattedDate
      });

      setTodo("");
    } catch (error) {
      console.error("Error adding todo", error);
    }
  }

  const handleToggleTodo = async (id: number) => {
    try {
      const sortedTodos = await Database.toggleTodo(id);
      setTodos(sortedTodos);
    } catch (error) {
      console.error("Error toggling todo", error);
    }
  }

  const handleDeleteTodo = async (id: number) => {
    try {
      await Database.deleteTodo(id);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Error deleting todo", error);
    }
  }

  const handleStopNotificationSound = async () => {
    await NotificationUtils.stopNotificationSound();
  };

  const fetchTodos = async () => {
    try {
      const fetchedTodos = await Database.getAllTodos();
      setTodos(fetchedTodos);
    } catch (error) {
      console.error("Error fetching todos", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <List todos={todos} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} />
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.queryView}>
          <TextInput
            placeholder="Add Todo"
            value={todo}
            onChangeText={(todo: string) => setTodo(todo)}
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddTodo}>
            <Ionicon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {NotificationUtils.isPlaying() && (
        <TouchableOpacity 
          style={styles.stopSoundButton} 
          onPress={handleStopNotificationSound}
        >
          <Text style={styles.stopSoundButtonText}>Stop Alarm</Text>
        </TouchableOpacity>
      )}

      {/* Floating AI Button */}
      <TouchableOpacity 
        style={styles.floatingAiButton}
        onPress={() => setIsAiModalVisible(true)}
      >
        <Ionicon name="chatbubble" size={24} color="white" />
      </TouchableOpacity>

      {/* AI Modal */}
      <Modal
        visible={isAiModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Assistant</Text>
              <TouchableOpacity 
                onPress={() => setIsAiModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.aiChatContainer}>
              {aiResponse ? (
                <View style={styles.aiResponse}>
                  <Text style={styles.responseText}>{aiResponse}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.aiInputContainer}>
              <TextInput
                placeholder="Ask me anything about your tasks..."
                value={aiQuery}
                onChangeText={setAiQuery}
                style={styles.aiInput}
                multiline
              />
              <TouchableOpacity 
                style={[styles.aiSendButton, isProcessing && styles.disabledButton]} 
                onPress={handleAiQuery}
                disabled={isProcessing}
              >
                <Ionicon 
                  name={isProcessing ? "hourglass" : "send"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
  },
  mainContent: {
    flex: 1,
    marginBottom: 100,
  },
  bottomBar: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    alignItems: 'center',
    color: "#fff",
    borderRadius: 8,
    justifyContent: "center",
    width: "20%"
  },
  input: {
    padding: 10,
    textAlign: "center",
    color: "black",
    outline: "none",
    width: "85%",
    boxShadow: "1px 2px 5px #ccc",
    borderRadius: 8
  },
  queryView: {
    flexDirection: "row",
    width: "100%",
    gap: 10
  },
  floatingAiButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  aiChatContainer: {
    flex: 1,
    marginBottom: 20,
  },
  aiResponse: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  responseText: {
    color: '#333',
    fontSize: 16,
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    maxHeight: 100,
    color: '#333',
  },
  aiSendButton: {
    backgroundColor: '#007bff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  stopSoundButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  stopSoundButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
export default Home