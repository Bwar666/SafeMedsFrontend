import * as Notifications from 'expo-notifications';
import { medicineUsageService } from '@/app/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Audio } from 'expo-av';

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
    private static readonly NOTIFICATION_CATEGORY = 'medicine_reminder_category';
    private static currentSound: Audio.Sound | null = null;

    static async initialize(): Promise<void> {
        try {
            // Set up notification categories with actions
            await Notifications.setNotificationCategoryAsync(
                this.NOTIFICATION_CATEGORY,
                [
                    {
                        identifier: 'stop_sound',
                        buttonTitle: 'Stop Sound',
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        },
                    },
                ]
            );

            // Listen for notification responses
            Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

            // Listen for notifications received
            Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
        } catch (error) {
            console.error('Failed to initialize notification service:', error);
        }
    }

    private static handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
        const { actionIdentifier } = response;

        if (actionIdentifier === 'stop_sound') {
            await this.stopCustomSound();
        }
    };

    private static handleNotificationReceived = async (notification: Notifications.Notification) => {
        if (notification.request.content.data?.type === 'medicine_reminder') {
            await this.playCustomSound();
        }
    };

    private static async playCustomSound(): Promise<void> {
        try {
            // Stop any existing sound first to ensure only one instance
            if (this.currentSound) {
                await this.currentSound.stopAsync();
                await this.currentSound.unloadAsync();
                this.currentSound = null;
            }

            // Create and play the custom sound
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/notification.mp3'),
                {
                    shouldPlay: true,
                    isLooping: true,
                    volume: 1.0
                }
            );

            this.currentSound = sound;
        } catch (error) {
            console.error('Failed to play custom sound:', error);
        }
    }

    private static async stopCustomSound(): Promise<void> {
        try {
            if (this.currentSound) {
                await this.currentSound.stopAsync();
                await this.currentSound.unloadAsync();
                this.currentSound = null;
            }
        } catch (error) {
            console.error('Failed to stop custom sound:', error);
        }
    }

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
                    title: 'ðŸ§ª Medicine Reminder',
                    body: fullBody,
                    categoryIdentifier: this.NOTIFICATION_CATEGORY,
                    sound: false, // Disable system sound, use custom sound
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
            await this.stopCustomSound();
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
            await this.stopCustomSound();
        } catch (error) {
            console.error('Failed to disable auto check:', error);
        }
    }
}