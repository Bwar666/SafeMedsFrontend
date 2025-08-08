// notificationStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationResult, NotificationStatus, NotificationSchedule } from './notificationTypes';

// Notification Storage Service for caching notification status
export class NotificationStorageService {
    private static readonly KEYS = {
        NOTIFICATION_STATUS: 'notification_status',
        NOTIFICATION_LOG: 'notification_log',
        NOTIFICATION_SCHEDULE: 'notification_schedule',
        LAST_OPERATIONS: 'last_notification_operations',
    } as const;

    // Store notification status
    static async storeNotificationStatus(status: NotificationStatus): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.NOTIFICATION_STATUS, JSON.stringify(status));
    }

    // Get notification status
    static async getNotificationStatus(): Promise<NotificationStatus | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.NOTIFICATION_STATUS);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Store operation result
    static async storeOperationResult(operation: string, result: NotificationResult): Promise<void> {
        try {
            const existingLog = await this.getNotificationLog();
            const updatedLog = [result, ...existingLog].slice(0, 20); // Keep last 20 operations
            await AsyncStorage.setItem(this.KEYS.NOTIFICATION_LOG, JSON.stringify(updatedLog));
        } catch (error) {
            console.log('Failed to store notification result:', error);
        }
    }

    // Get notification log
    static async getNotificationLog(): Promise<NotificationResult[]> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.NOTIFICATION_LOG);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Store last operation timestamp
    static async storeLastOperation(operation: string): Promise<void> {
        try {
            const existing = await this.getLastOperations();
            existing[operation] = new Date().toISOString();
            await AsyncStorage.setItem(this.KEYS.LAST_OPERATIONS, JSON.stringify(existing));
        } catch (error) {
            console.log('Failed to store last operation:', error);
        }
    }

    // Get last operations
    static async getLastOperations(): Promise<{ [key: string]: string }> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_OPERATIONS);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    // Store notification schedule
    static async storeNotificationSchedule(schedule: NotificationSchedule): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.NOTIFICATION_SCHEDULE, JSON.stringify(schedule));
    }

    // Get notification schedule
    static async getNotificationSchedule(): Promise<NotificationSchedule | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.NOTIFICATION_SCHEDULE);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Clear all notification data
    static async clearNotificationData(): Promise<void> {
        const keys = Object.values(this.KEYS);
        await AsyncStorage.multiRemove(keys);
    }
}