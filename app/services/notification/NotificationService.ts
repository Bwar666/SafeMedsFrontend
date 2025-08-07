// notificationApi.ts - Notification Management Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions for Notification Operations
export interface NotificationResult {
    success: boolean;
    message: string;
    timestamp: string;
    operation: string;
}

export interface NotificationStatus {
    missedDosesProcessed: boolean;
    upcomingIntakesChecked: boolean;
    lowInventoryChecked: boolean;
    lastProcessed: {
        missedDoses?: string;
        upcomingIntakes?: string;
        lowInventory?: string;
        userMissedDoses?: string;
    };
}

export interface NotificationSchedule {
    enabled: boolean;
    frequency: 'manual' | 'hourly' | 'daily';
    lastRun?: string;
    nextRun?: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}

// API Response Handler (reusing from userApi pattern)
const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw {
            message: errorData.message || `HTTP ${response.status}`,
            code: errorData.code || 'API_ERROR',
            details: errorData
        } as ApiError;
    }

    // Handle string responses from your controller
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        // Return the string response as message object
        return { message: text } as T;
    }
};

// Notification API Service Class
class NotificationApiService {
    private readonly baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: this.getHeaders(),
        });
        return handleApiResponse<T>(response);
    }

    // Process Missed Doses - POST /api/notifications/process-missed
    async processMissedDoses(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/process-missed', {
            method: 'POST',
        });
    }

    // Check Upcoming Intakes - POST /api/notifications/check-upcoming
    async checkUpcomingIntakes(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/check-upcoming', {
            method: 'POST',
        });
    }

    // Check Low Inventory - POST /api/notifications/check-inventory
    async checkLowInventory(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/check-inventory', {
            method: 'POST',
        });
    }

    // Process User Missed Doses - POST /api/notifications/users/{userId}/process-missed
    async processUserMissedDoses(userId: string): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>(`/api/notifications/users/${userId}/process-missed`, {
            method: 'POST',
        });
    }
}

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

// High-level Notification Service
export class NotificationService {
    private apiService: NotificationApiService;

    constructor() {
        this.apiService = new NotificationApiService();
    }

    // Process missed doses with logging
    async processMissedDoses(): Promise<NotificationResult> {
        const operation = 'process_missed_doses';
        const timestamp = new Date().toISOString();

        try {
            const response = await this.apiService.processMissedDoses();

            const result: NotificationResult = {
                success: true,
                message: response.message,
                timestamp,
                operation
            };

            // Store operation result and timestamp
            await Promise.all([
                NotificationStorageService.storeOperationResult(operation, result),
                NotificationStorageService.storeLastOperation(operation)
            ]);

            return result;
        } catch (error) {
            const result: NotificationResult = {
                success: false,
                message: `Failed to process missed doses: ${(error as ApiError).message}`,
                timestamp,
                operation
            };

            await NotificationStorageService.storeOperationResult(operation, result);
            return result;
        }
    }

    // Check upcoming intakes with logging
    async checkUpcomingIntakes(): Promise<NotificationResult> {
        const operation = 'check_upcoming_intakes';
        const timestamp = new Date().toISOString();

        try {
            const response = await this.apiService.checkUpcomingIntakes();

            const result: NotificationResult = {
                success: true,
                message: response.message,
                timestamp,
                operation
            };

            await Promise.all([
                NotificationStorageService.storeOperationResult(operation, result),
                NotificationStorageService.storeLastOperation(operation)
            ]);

            return result;
        } catch (error) {
            const result: NotificationResult = {
                success: false,
                message: `Failed to check upcoming intakes: ${(error as ApiError).message}`,
                timestamp,
                operation
            };

            await NotificationStorageService.storeOperationResult(operation, result);
            return result;
        }
    }

    // Check low inventory with logging
    async checkLowInventory(): Promise<NotificationResult> {
        const operation = 'check_low_inventory';
        const timestamp = new Date().toISOString();

        try {
            const response = await this.apiService.checkLowInventory();

            const result: NotificationResult = {
                success: true,
                message: response.message,
                timestamp,
                operation
            };

            await Promise.all([
                NotificationStorageService.storeOperationResult(operation, result),
                NotificationStorageService.storeLastOperation(operation)
            ]);

            return result;
        } catch (error) {
            const result: NotificationResult = {
                success: false,
                message: `Failed to check low inventory: ${(error as ApiError).message}`,
                timestamp,
                operation
            };

            await NotificationStorageService.storeOperationResult(operation, result);
            return result;
        }
    }

    // Process user missed doses with logging
    async processUserMissedDoses(userId: string): Promise<NotificationResult> {
        const operation = 'process_user_missed_doses';
        const timestamp = new Date().toISOString();

        try {
            const response = await this.apiService.processUserMissedDoses(userId);

            const result: NotificationResult = {
                success: true,
                message: response.message,
                timestamp,
                operation
            };

            await Promise.all([
                NotificationStorageService.storeOperationResult(operation, result),
                NotificationStorageService.storeLastOperation(`${operation}_${userId}`)
            ]);

            return result;
        } catch (error) {
            const result: NotificationResult = {
                success: false,
                message: `Failed to process user missed doses: ${(error as ApiError).message}`,
                timestamp,
                operation
            };

            await NotificationStorageService.storeOperationResult(operation, result);
            return result;
        }
    }

    // Run all notification checks (comprehensive check)
    async runAllNotificationChecks(userId?: string): Promise<NotificationResult[]> {
        const results: NotificationResult[] = [];

        // Run global checks
        const globalChecks = await Promise.allSettled([
            this.processMissedDoses(),
            this.checkUpcomingIntakes(),
            this.checkLowInventory()
        ]);

        globalChecks.forEach((result) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    success: false,
                    message: `Operation failed: ${result.reason}`,
                    timestamp: new Date().toISOString(),
                    operation: 'global_check'
                });
            }
        });

        // Run user-specific check if userId provided
        if (userId) {
            const userResult = await this.processUserMissedDoses(userId);
            results.push(userResult);
        }

        // Update notification status
        const status: NotificationStatus = {
            missedDosesProcessed: results.some(r => r.operation === 'process_missed_doses' && r.success),
            upcomingIntakesChecked: results.some(r => r.operation === 'check_upcoming_intakes' && r.success),
            lowInventoryChecked: results.some(r => r.operation === 'check_low_inventory' && r.success),
            lastProcessed: {
                missedDoses: results.find(r => r.operation === 'process_missed_doses')?.timestamp,
                upcomingIntakes: results.find(r => r.operation === 'check_upcoming_intakes')?.timestamp,
                lowInventory: results.find(r => r.operation === 'check_low_inventory')?.timestamp,
                userMissedDoses: userId ? results.find(r => r.operation === 'process_user_missed_doses')?.timestamp : undefined
            }
        };

        await NotificationStorageService.storeNotificationStatus(status);
        return results;
    }

    // Utility Methods
    async getNotificationStatus(): Promise<NotificationStatus | null> {
        return NotificationStorageService.getNotificationStatus();
    }

    async getNotificationHistory(): Promise<NotificationResult[]> {
        return NotificationStorageService.getNotificationLog();
    }

    async getLastOperationTime(operation: string): Promise<string | null> {
        const operations = await NotificationStorageService.getLastOperations();
        return operations[operation] || null;
    }

    async clearNotificationCache(): Promise<void> {
        await NotificationStorageService.clearNotificationData();
    }

    // Check if notification operations are needed based on schedule
    async isNotificationCheckNeeded(operation: string, intervalMinutes: number = 60): Promise<boolean> {
        const lastOperation = await this.getLastOperationTime(operation);
        if (!lastOperation) return true;

        const now = new Date();
        const lastRun = new Date(lastOperation);
        const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60);

        return minutesSinceLastRun >= intervalMinutes;
    }

    // Get notification summary for UI
    async getNotificationSummary(): Promise<{
        status: NotificationStatus | null;
        recentResults: NotificationResult[];
        checksNeeded: boolean;
        lastActivity: string | null;
    }> {
        const [status, history] = await Promise.all([
            this.getNotificationStatus(),
            this.getNotificationHistory()
        ]);

        const checksNeeded = await this.isNotificationCheckNeeded('process_missed_doses', 60);
        const lastActivity = history.length > 0 ? history[0].timestamp : null;

        return {
            status,
            recentResults: history.slice(0, 5), // Last 5 results
            checksNeeded,
            lastActivity
        };
    }

    // Format notification result for display
    formatNotificationResult(result: NotificationResult): string {
        const time = new Date(result.timestamp).toLocaleTimeString();
        const status = result.success ? '✅' : '❌';
        return `${status} ${result.operation.replace(/_/g, ' ')} - ${result.message} (${time})`;
    }

    // Validate operation name
    validateOperation(operation: string): boolean {
        const validOperations = [
            'process_missed_doses',
            'check_upcoming_intakes',
            'check_low_inventory',
            'process_user_missed_doses'
        ];
        return validOperations.includes(operation);
    }
}

// Export singleton instance
export const notificationService = new NotificationService();