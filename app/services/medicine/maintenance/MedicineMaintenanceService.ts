// medicineMaintenanceService.ts
import {
    MaintenanceResult,
    SystemHealthCheck,
    BatchProcessResult,
    ApiError
} from './MedicineMaintenanceTypes';
import { MedicineMaintenanceApiService } from './MedicineMaintenanceApiService';
import { MedicineMaintenanceStorageService } from './MedicineMaintenanceStorageService';

// High-level Medicine Maintenance Service
export class MedicineMaintenanceService {
    private apiService: MedicineMaintenanceApiService;

    constructor() {
        this.apiService = new MedicineMaintenanceApiService();
    }

    // Main maintenance operation from your controller
    async processAllMissedDoses(): Promise<MaintenanceResult> {
        try {
            const startTime = new Date().toISOString();

            await this.apiService.processAllMissedDoses();

            const result: MaintenanceResult = {
                success: true,
                message: 'All missed doses processed successfully'
            };

            // Log the maintenance operation
            const logEntry: BatchProcessResult = {
                operation: 'process_all_missed_doses',
                totalItems: 0, // Would be filled by actual API response
                processedItems: 0,
                successCount: 0,
                errorCount: 0,
                startTime,
                endTime: new Date().toISOString(),
                errors: []
            };

            await Promise.all([
                MedicineMaintenanceStorageService.storeLastMaintenance('process_missed_doses'),
                MedicineMaintenanceStorageService.storMaintenanceLog(logEntry)
            ]);

            return result;
        } catch (error) {
            const result: MaintenanceResult = {
                success: false,
                message: `Failed to process missed doses: ${(error as ApiError).message}`,
                errorCount: 1
            };

            return result;
        }
    }

    // Additional maintenance operations
    async performSystemHealthCheck(): Promise<SystemHealthCheck> {
        try {
            const health = await this.apiService.performHealthCheck();
            await MedicineMaintenanceStorageService.storeSystemHealth(health);
            return health;
        } catch (error) {
            // Return cached health if available, otherwise create error health status
            const cachedHealth = await MedicineMaintenanceStorageService.getSystemHealth();
            if (cachedHealth) {
                return cachedHealth;
            }

            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                checks: {
                    database: false,
                    notifications: false,
                    scheduling: false,
                    apiConnectivity: false
                },
                metrics: {
                    totalUsers: 0,
                    activeMedicines: 0,
                    pendingIntakes: 0,
                    overdueIntakes: 0
                }
            };
        }
    }

    async cleanupOldData(daysOld: number = 90): Promise<BatchProcessResult> {
        try {
            const result = await this.apiService.cleanupOldData(daysOld);
            await MedicineMaintenanceStorageService.storMaintenanceLog(result);
            await MedicineMaintenanceStorageService.storeLastMaintenance('cleanup_old_data');
            return result;
        } catch (error) {
            throw error;
        }
    }

    async rebuildAllSchedules(): Promise<BatchProcessResult> {
        try {
            const result = await this.apiService.rebuildAllSchedules();
            await MedicineMaintenanceStorageService.storMaintenanceLog(result);
            await MedicineMaintenanceStorageService.storeLastMaintenance('rebuild_schedules');
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateAllInventories(): Promise<BatchProcessResult> {
        try {
            const result = await this.apiService.updateAllInventories();
            await MedicineMaintenanceStorageService.storMaintenanceLog(result);
            await MedicineMaintenanceStorageService.storeLastMaintenance('update_inventories');
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Utility Methods
    async getMaintenanceHistory(): Promise<BatchProcessResult[]> {
        return MedicineMaintenanceStorageService.getMaintenanceLog();
    }

    async getLastMaintenanceTime(operation: string): Promise<Date | null> {
        return MedicineMaintenanceStorageService.getLastMaintenance(operation);
    }

    async getCachedSystemHealth(): Promise<SystemHealthCheck | null> {
        return MedicineMaintenanceStorageService.getSystemHealth();
    }

    async clearMaintenanceCache(): Promise<void> {
        await MedicineMaintenanceStorageService.clearMaintenanceData();
    }

    // Check if maintenance is needed based on last run time
    async isMaintenanceNeeded(operation: string, intervalHours: number = 24): Promise<boolean> {
        const lastMaintenance = await this.getLastMaintenanceTime(operation);
        if (!lastMaintenance) return true;

        const now = new Date();
        const hoursSinceLastRun = (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60);

        return hoursSinceLastRun >= intervalHours;
    }

    // Get maintenance status summary
    async getMaintenanceStatus(): Promise<{
        systemHealth: SystemHealthCheck | null;
        lastProcessMissedDoses: Date | null;
        maintenanceNeeded: boolean;
        recentOperations: BatchProcessResult[];
    }> {
        const [systemHealth, lastProcessed, recentOps] = await Promise.all([
            this.getCachedSystemHealth(),
            this.getLastMaintenanceTime('process_missed_doses'),
            this.getMaintenanceHistory()
        ]);

        const maintenanceNeeded = await this.isMaintenanceNeeded('process_missed_doses', 24);

        return {
            systemHealth,
            lastProcessMissedDoses: lastProcessed,
            maintenanceNeeded,
            recentOperations: recentOps.slice(0, 5) // Last 5 operations
        };
    }

    // Run scheduled maintenance check
    async runScheduledMaintenance(): Promise<MaintenanceResult[]> {
        const results: MaintenanceResult[] = [];

        try {
            // Check if missed doses processing is needed
            const needsProcessing = await this.isMaintenanceNeeded('process_missed_doses', 24);

            if (needsProcessing) {
                console.log('Running scheduled missed doses processing...');
                const result = await this.processAllMissedDoses();
                results.push(result);
            }

            // Perform health check
            try {
                await this.performSystemHealthCheck();
                results.push({
                    success: true,
                    message: 'System health check completed'
                });
            } catch (error) {
                results.push({
                    success: false,
                    message: `Health check failed: ${(error as Error).message}`
                });
            }

        } catch (error) {
            results.push({
                success: false,
                message: `Scheduled maintenance failed: ${(error as Error).message}`
            });
        }

        return results;
    }

    // Emergency maintenance operations
    async performEmergencyMaintenance(): Promise<MaintenanceResult[]> {
        const results: MaintenanceResult[] = [];

        try {
            // Force process all missed doses
            console.log('Performing emergency maintenance - processing missed doses...');
            const missedDosesResult = await this.processAllMissedDoses();
            results.push(missedDosesResult);

            // Perform health check
            await this.performSystemHealthCheck();
            results.push({
                success: true,
                message: 'Emergency health check completed'
            });

            // Log emergency maintenance
            const logEntry: BatchProcessResult = {
                operation: 'emergency_maintenance',
                totalItems: results.length,
                processedItems: results.filter(r => r.success).length,
                successCount: results.filter(r => r.success).length,
                errorCount: results.filter(r => !r.success).length,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                errors: results.filter(r => !r.success).map(r => r.message)
            };

            await MedicineMaintenanceStorageService.storMaintenanceLog(logEntry);

        } catch (error) {
            results.push({
                success: false,
                message: `Emergency maintenance failed: ${(error as Error).message}`
            });
        }

        return results;
    }

    // Validate system requirements for maintenance
    async validateMaintenanceRequirements(): Promise<{
        canPerformMaintenance: boolean;
        requirements: {
            networkConnectivity: boolean;
            sufficientStorage: boolean;
            systemHealthy: boolean;
        };
        recommendations: string[];
    }> {
        const recommendations: string[] = [];

        // Check network connectivity (simplified check)
        let networkConnectivity = true;
        try {
            await this.apiService.performHealthCheck();
        } catch {
            networkConnectivity = false;
            recommendations.push('Check network connectivity before running maintenance');
        }

        // Check storage (simplified - you might want to implement actual storage check)
        const sufficientStorage = true; // Placeholder

        // Check system health
        const systemHealth = await this.getCachedSystemHealth();
        const systemHealthy = systemHealth?.status !== 'error';

        if (!systemHealthy) {
            recommendations.push('Resolve system health issues before maintenance');
        }

        const canPerformMaintenance = networkConnectivity && sufficientStorage && systemHealthy;

        if (!canPerformMaintenance) {
            recommendations.push('Fix the above issues before proceeding with maintenance');
        }

        return {
            canPerformMaintenance,
            requirements: {
                networkConnectivity,
                sufficientStorage,
                systemHealthy
            },
            recommendations
        };
    }

    // Format maintenance results for display
    formatMaintenanceResult(result: MaintenanceResult): string {
        let message = result.message;

        if (result.processedCount !== undefined) {
            message += ` (Processed: ${result.processedCount})`;
        }

        if (result.errorCount !== undefined && result.errorCount > 0) {
            message += ` (Errors: ${result.errorCount})`;
        }

        return message;
    }

    // Get human-readable maintenance status
    getMaintenanceStatusText(systemHealth: SystemHealthCheck | null): string {
        if (!systemHealth) {
            return 'System health unknown - check needed';
        }

        switch (systemHealth.status) {
            case 'healthy':
                return 'System operating normally';
            case 'warning':
                return 'System has minor issues - monitoring recommended';
            case 'error':
                return 'System has critical issues - maintenance required';
            default:
                return 'Unknown system status';
        }
    }

    // Check if maintenance window is appropriate (e.g., during low usage hours)
    isMaintenanceWindowAppropriate(): boolean {
        const now = new Date();
        const hour = now.getHours();

        // Suggest maintenance during typical low-usage hours (2 AM - 5 AM)
        return hour >= 2 && hour <= 5;
    }

    // Get next recommended maintenance time
    getNextMaintenanceWindow(): Date {
        const now = new Date();
        const nextMaintenance = new Date(now);

        // Set to next 3 AM
        nextMaintenance.setHours(3, 0, 0, 0);

        // If it's already past 3 AM today, schedule for tomorrow
        if (now.getHours() >= 3) {
            nextMaintenance.setDate(nextMaintenance.getDate() + 1);
        }

        return nextMaintenance;
    }
}

// Export singleton instances
export const medicineMaintenanceService = new MedicineMaintenanceService();
export const medicineMaintenanceApiService = new MedicineMaintenanceApiService();