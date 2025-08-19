import * as Notifications from 'expo-notifications';
import { medicineUsageService } from '@/app/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface ScheduledNotification {
    intakeEventId: string;
    notificationId: string;
    medicineName: string;
    scheduledDateTime: string;
}

// Background task definition
const BACKGROUND_NOTIFICATION_TASK = 'medicine-notification-check';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
    try {
        const userId = await AsyncStorage.getItem('medicine_user_id');
        if (userId) {
            await MedicineNotificationService.scheduleUpcomingReminders(userId);
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export class MedicineNotificationService {
    private static readonly STORAGE_KEY = 'scheduled_medicine_notifications';
    private static readonly NOTIFICATION_SOUND = '../../../assets/notification_sound.mp3'


    static async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            return false;
        }
    }

    static async scheduleUpcomingReminders(userId: string|null): Promise<void> {
        try {
            if (!userId) return;

            const upcomingIntakes = await medicineUsageService.getUpcomingIntakes(userId, 24);
            await this.cancelAllNotifications();
            const scheduledNotifications: ScheduledNotification[] = [];

            for (const intake of upcomingIntakes) {
                const scheduledTime = new Date(intake.scheduledDateTime);
                const now = new Date();

                if (scheduledTime > now) {
                    const notificationId = await this.scheduleIntakeNotification(intake);
                    if (notificationId) {
                        scheduledNotifications.push({
                            intakeEventId: intake.id,
                            notificationId: notificationId,
                            medicineName: intake.medicineName,
                            scheduledDateTime: intake.scheduledDateTime
                        });
                    }
                }
            }
            await this.storeScheduledNotifications(scheduledNotifications);
        } catch (error) {
            console.error('Failed to schedule upcoming reminders:', error);
        }
    }

    private static async scheduleIntakeNotification(intake: any): Promise<string | null> {
        try {
            if (!(await this.requestPermissions())) {
                return null;
            }

            const scheduledTime = new Date(intake.scheduledDateTime);
            const now = new Date();
            const secondsUntilNotification = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);

            if (secondsUntilNotification <= 0) return null;

            let foodInstructionText = '';
            if (intake.foodInstruction) {
                switch (intake.foodInstruction) {
                    case 'BEFORE_EATING': foodInstructionText = ' (before eating)'; break;
                    case 'AFTER_EATING': foodInstructionText = ' (after eating)'; break;
                    case 'WITH_FOOD': foodInstructionText = ' (with food)'; break;
                    case 'EMPTY_STOMACH': foodInstructionText = ' (on empty stomach)'; break;
                }
            }

            const fullBody = `Time to take ${intake.medicineName}${foodInstructionText}\n${intake.formattedDosage}`;

            return await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🧪 Medicine Reminder',
                    body: fullBody,
                    sound: this.NOTIFICATION_SOUND,
                    data: {
                        type: 'medicine_reminder',
                        intakeEventId: intake.id,
                        medicineName: intake.medicineName,
                        medicineId: intake.medicineId,
                        scheduledDateTime: intake.scheduledDateTime
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntilNotification,
                },
            });

        } catch (error) {
            return null;
        }
    }

    static async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await AsyncStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
        }
    }

    private static async storeScheduledNotifications(notifications: ScheduledNotification[]): Promise<void> {
        try {
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
        }
    }

    static async refreshNotifications(userId: string): Promise<void> {
        await this.scheduleUpcomingReminders(userId);
    }

    static async enableAutoCheck(userId: string | null): Promise<boolean> {
        if(!userId) return false;

        try {
            await AsyncStorage.setItem('medicine_user_id', userId);

            // Register background task to run every 8 hours
            await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
                minimumInterval: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
                stopOnTerminate: false,
                startOnBoot: true,
            });

            return true;
        } catch (error) {
            console.error('Failed to enable auto check:', error);
            return false;
        }
    }

    static async disableAutoCheck(): Promise<void> {
        try {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
            await AsyncStorage.removeItem('medicine_user_id');
        } catch (error) {
            console.error('Failed to disable auto check:', error);
        }
    }
}