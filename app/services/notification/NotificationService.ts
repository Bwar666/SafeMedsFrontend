// notificationService.ts
import { NotificationResult, NotificationStatus, NotificationSchedule, ApiError } from './notificationTypes';
import { NotificationApiService } from './NotificationApiService';
import { NotificationStorageService } from './NotificationStorageService';

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