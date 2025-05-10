import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Global sound management
class SoundManager {
  private static instance: SoundManager | null = null;
  private soundObject: Audio.Sound | null = null;
  private isPlayingSound = false;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async playSound(soundFile: any, options: { loop?: boolean } = {}) {
    try {
      // Stop any existing sound first
      await this.stopSound();

      // Prevent multiple simultaneous sound plays
      if (this.isPlayingSound) {
        console.log('Sound is already playing');
        return;
      }

      // Create sound object
      const { sound } = await Audio.Sound.createAsync(
        soundFile, 
        { 
          shouldPlay: true,
          isLooping: options.loop || false,
          volume: 1.0 
        }
      );

      // Set up sound object
      this.soundObject = sound;
      this.isPlayingSound = true;

      // Add a listener to reset state when sound is done
      this.soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.resetSoundState();
        }
      });

      // Play the sound
      await this.soundObject.playAsync();
    } catch (error) {
      console.error('Error in playSound:', error);
      this.resetSoundState();
    }
  }

  async stopSound() {
    try {
      if (this.soundObject) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      }
    } catch (error) {
      console.error('Error in stopSound:', error);
    } finally {
      this.resetSoundState();
    }
  }

  private resetSoundState() {
    this.soundObject = null;
    this.isPlayingSound = false;
  }

  isPlaying(): boolean {
    return this.isPlayingSound;
  }
}

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationUtils = {
  // Request notification permissions
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.error('Failed to get push token for push notification!');
        return false;
      }

      // Additional configuration for iOS
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Schedule a notification for a specific task
  async scheduleTodoNotification(todo: {
    id: number, 
    item: string, 
    date: string
  }) {
    try {
      // Ensure permissions are granted
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('No notification permissions');
        return;
      }

      // Parse the date
      const dueDate = new Date(todo.date);
      
      // Schedule notification 15 minutes before due time
      const triggerDate = new Date(dueDate.getTime() - 15 * 60 * 1000);

      // Check if the trigger date is in the future
      if (triggerDate < new Date()) {
        console.log('Notification trigger date is in the past');
        return;
      }

      // Create a notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Todo Reminder",
          body: `Your task "${todo.item}" is due soon!`,
          data: { 
            todoId: todo.id,
          },
          sound: true,
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log(`Notification scheduled for todo ${todo.id} at ${triggerDate}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  // Cancel a specific notification
  async cancelNotification(todoId: number) {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel notifications for this todo
      for (const notification of scheduledNotifications) {
        if (notification.content.data.todoId === todoId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Setup notification listeners
  setupNotificationListeners() {
    const soundManager = SoundManager.getInstance();

    // Listener for foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('Notification received in foreground:', notification);
      
      try {
        // Play sound with looping
        await soundManager.playSound(require('../assets/alarm.mp3'), { loop: true });
      } catch (error) {
        console.error('Error playing foreground notification sound:', error);
      }
    });

    // Listener for notification interactions
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('Notification tapped:', response);
      
      try {
        // Stop the sound when notification is tapped
        await soundManager.stopSound();
      } catch (error) {
        console.error('Error stopping sound on notification tap:', error);
      }
      
      const todoId = response.notification.request.content.data.todoId;
      console.log('Tapped notification for todo:', todoId);
    });

    // Return cleanup function
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  },

  // Method to stop the sound
  async stopNotificationSound() {
    const soundManager = SoundManager.getInstance();
    await soundManager.stopSound();
  },

  // Method to check if sound is playing
  isPlaying(): boolean {
    const soundManager = SoundManager.getInstance();
    return soundManager.isPlaying();
  },

  // Initialize notification setup
  async initializeNotifications() {
    // Request permissions
    await this.requestPermissions();

    // Setup listeners
    const cleanup = this.setupNotificationListeners();

    // Return cleanup function if needed
    return cleanup;
  },
};
