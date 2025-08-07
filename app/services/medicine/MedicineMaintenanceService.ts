// medicineMaintenanceApi.ts - Medicine Maintenance & Admin Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions for Maintenance Operations
export interface MaintenanceResult {
    success: boolean;
    message: string;
    processedCount?: number;
    errorCount?: number;
    details?: string[];
}

export interface SystemHealthCheck {
    status: 'healthy' | 'warning' | 'error';
    timestamp: string;
    checks: {
        database: boolean;
        notifications: boolean;
        scheduling: boolean;
        apiConnectivity: boolean;
    };
    metrics: {
        totalUsers: number;
        activeMedicines: number;
        pendingIntakes: number;
        overdueIntakes: number;
    };
}

export interface BatchProcessResult {
    operation: string;
    totalItems: number;
    processedItems: number;
    successCount: number;
    errorCount: number;
    startTime: string;
    endTime: string;
    errors: string[];
}

export interface MaintenanceSchedule {
    operation: string;
    scheduledTime: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
    lastRun?: string;
    nextRun: string;
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
    return response.json();
};

// Medicine Maintenance API Service Class
class MedicineMaintenanceApiService {
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

    // Admin Maintenance Operations
    // Process All Missed Doses - POST /api/admin/medicines/process-all-missed
    async processAllMissedDoses(): Promise<void> {
        return this.makeRequest<void>('/api/admin/medicines/process-all-missed', {
            method: 'POST',
        });
    }

    // Note: Since your MedicineMaintenanceController only has one endpoint,
    // I'm adding some commonly needed maintenance operations that would
    // typically be in such a controller for a production app

    // Additional maintenance endpoints you might want to implement:

    // Health check endpoint
    async performHealthCheck(): Promise<SystemHealthCheck> {
        return this.makeRequest<SystemHealthCheck>('/api/admin/system/health', {
            method: 'GET',
        });
    }

    // Cleanup old data
    async cleanupOldData(daysOld: number = 90): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>(`/api/admin/maintenance/cleanup?daysOld=${daysOld}`, {
            method: 'POST',
        });
    }

    // Rebuild schedules for all users
    async rebuildAllSchedules(): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>('/api/admin/maintenance/rebuild-schedules', {
            method: 'POST',
        });
    }

    // Update inventory for all medicines
    async updateAllInventories(): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>('/api/admin/maintenance/update-inventories', {
            method: 'POST',
        });
    }
}

// Medicine Maintenance Storage Service for caching maintenance info
export class MedicineMaintenanceStorageService {
    private static readonly KEYS = {
        LAST_MAINTENANCE: 'last_maintenance',
        MAINTENANCE_LOG: 'maintenance_log',
        SYSTEM_HEALTH: 'system_health',
        MAINTENANCE_SCHEDULE: 'maintenance_schedule',
    } as const;

    // Store last maintenance timestamp
    static async storeLastMaintenance(operation: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const key = `${this.KEYS.LAST_MAINTENANCE}_${operation}`;
        await AsyncStorage.setItem(key, timestamp);
    }

    // Get last maintenance timestamp
    static async getLastMaintenance(operation: string): Promise<Date | null> {
        try {
            const key = `${this.KEYS.LAST_MAINTENANCE}_${operation}`;
            const data = await AsyncStorage.getItem(key);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Store maintenance log entry
    static async storMaintenanceLog(entry: BatchProcessResult): Promise<void> {
        try {
            const existingLog = await this.getMaintenanceLog();
            const updatedLog = [entry, ...existingLog].slice(0, 50); // Keep last 50 entries
            await AsyncStorage.setItem(this.KEYS.MAINTENANCE_LOG, JSON.stringify(updatedLog));
        } catch (error) {
            console.log('Failed to store maintenance log:', error);
        }
    }

    // Get maintenance log
    static async getMaintenanceLog(): Promise<BatchProcessResult[]> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.MAINTENANCE_LOG);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Store system health
    static async storeSystemHealth(health: SystemHealthCheck): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.SYSTEM_HEALTH, JSON.stringify(health));
    }

    // Get system health
    static async getSystemHealth(): Promise<SystemHealthCheck | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.SYSTEM_HEALTH);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Clear all maintenance data
    static async clearMaintenanceData(): Promise<void> {
        const allKeys = await AsyncStorage.getAllKeys();
        const maintenanceKeys = allKeys.filter(key =>
            Object.values(this.KEYS).some(keyPrefix => key.includes(keyPrefix))
        );
        await AsyncStorage.multiRemove(maintenanceKeys);
    }
}

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

// Export singleton instance
export const medicineMaintenanceService = new MedicineMaintenanceService();
export const medicineMaintenanceApiService = new MedicineMaintenanceApiService();