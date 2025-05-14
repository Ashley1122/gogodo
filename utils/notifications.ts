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
        if (!status.isLoaded && !status.error) {
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
    if (!this.soundObject) {
      this.resetSoundState();
      return;
    }

    try {
      const status = await this.soundObject.getStatusAsync();
      if (status.isLoaded) {
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
      console.log('=== CHECKING NOTIFICATION PERMISSIONS ===');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('New permission status:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get notification permissions');
        return false;
      }

      // Additional configuration for iOS
      if (Platform.OS === 'ios') {
        console.log('Configuring iOS notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } else if (Platform.OS === 'android') {
        console.log('Configuring Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      console.log('✅ Notification permissions and channels configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in requestPermissions:', error);
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
        console.log('❌ No notification permissions');
        return;
      }

      // Parse the date using the same format as the database
      const regex = /(\w+)\s+(\d+),\s+(\d+)\s+at\s+(\d+):(\d+)\s+(\w+)/;
      const match = todo.date.match(regex);
      
      if (!match) {
        return;
      }
      
      const [_, month, day, year, hours, minutes, period] = match;
      
      // Convert month name to month index (0-11)
      const monthNames = {
        "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
        "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
      };
      
      const monthIndex = monthNames[month as keyof typeof monthNames];
      if (monthIndex === undefined) {
        return;
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
      
      // Create date object in local time
      const dueDate = new Date(parsedYear, monthIndex, parsedDay, parsedHours, parsedMinutes, 0);
      
      // For same-day notifications, set trigger to 1 minute before
      const now = new Date();
      const isSameDay = dueDate.getDate() === now.getDate() && 
                       dueDate.getMonth() === now.getMonth() && 
                       dueDate.getFullYear() === now.getFullYear();
      
      // Schedule notification 15 minutes before due time, or 1 minute before for same-day
      const triggerDate = isSameDay 
        ? new Date(dueDate.getTime() - 60 * 1000) // 1 minute before
        : new Date(dueDate.getTime() - 15 * 60 * 1000); // 15 minutes before
    

      // Check if the trigger date is in the future
      const timeDiff = triggerDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
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
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log('Notification ID:', notificationId);
      console.log('Scheduled for:', triggerDate.toLocaleString());
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
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
    console.log('Setting up notification listeners...');
    const soundManager = SoundManager.getInstance();

    // Listener for foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('📬 Notification received in foreground:', notification);
      
      try {
        // Play sound with looping
        await soundManager.playSound(require('../assets/alarm.mp3'), { loop: true });
      } catch (error) {
        console.error('❌ Error playing foreground notification sound:', error);
      }
    });

    // Listener for notification interactions
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('👆 Notification tapped:', response);
      
      try {
        // Stop the sound when notification is tapped
        await soundManager.stopSound();
      } catch (error) {
        console.error('❌ Error stopping sound on notification tap:', error);
      }
      
      const todoId = response.notification.request.content.data.todoId;
      console.log('Tapped notification for todo:', todoId);
    });

    console.log('✅ Notification listeners setup complete');
    // Return cleanup function
    return () => {
      console.log('Cleaning up notification listeners...');
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
    console.log('=== INITIALIZING NOTIFICATIONS ===');
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Failed to initialize notifications - no permissions');
        return;
      }

      // Setup listeners
      console.log('Setting up notification listeners...');
      const cleanup = this.setupNotificationListeners();
      console.log('✅ Notification listeners setup complete');

      // Return cleanup function if needed
      return cleanup;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  },

  // Test function to schedule an immediate notification
  async testNotification() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('No notification permissions');
        return;
      }

      const triggerDate = new Date(Date.now() + 60 * 1000); // 1 minute from now
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log(`Test notification scheduled with ID: ${notificationId} for ${triggerDate}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  },
};
