// medicineMaintenanceStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemHealthCheck, BatchProcessResult } from './MedicineMaintenanceTypes';

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