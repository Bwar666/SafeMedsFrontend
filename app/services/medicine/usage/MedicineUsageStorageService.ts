// medicineUsageStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DailyMedicineSchedule,
    IntakeEvent,
    MedicineResponse
} from './MedicineUsageTypes';

// Medicine Usage Storage Service for offline caching
export class MedicineUsageStorageService {
    private static readonly KEYS = {
        DAILY_SCHEDULE: 'daily_schedule',
        UPCOMING_INTAKES: 'upcoming_intakes',
        OVERDUE_INTAKES: 'overdue_intakes',
        LOW_INVENTORY: 'low_inventory_medicines',
        LAST_SYNC: 'usage_last_sync',
    } as const;

    // Daily schedule caching
    static async storeDailySchedule(userId: string, date: string, schedule: DailyMedicineSchedule): Promise<void> {
        const key = `${this.KEYS.DAILY_SCHEDULE}_${userId}_${date}`;
        await AsyncStorage.setItem(key, JSON.stringify(schedule));
        await this.updateLastSync();
    }

    static async getStoredDailySchedule(userId: string, date: string): Promise<DailyMedicineSchedule | null> {
        try {
            const key = `${this.KEYS.DAILY_SCHEDULE}_${userId}_${date}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Upcoming intakes caching
    static async storeUpcomingIntakes(userId: string, intakes: IntakeEvent[]): Promise<void> {
        const key = `${this.KEYS.UPCOMING_INTAKES}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(intakes));
    }

    static async getStoredUpcomingIntakes(userId: string): Promise<IntakeEvent[]> {
        try {
            const key = `${this.KEYS.UPCOMING_INTAKES}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Overdue intakes caching
    static async storeOverdueIntakes(userId: string, intakes: IntakeEvent[]): Promise<void> {
        const key = `${this.KEYS.OVERDUE_INTAKES}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(intakes));
    }

    static async getStoredOverdueIntakes(userId: string): Promise<IntakeEvent[]> {
        try {
            const key = `${this.KEYS.OVERDUE_INTAKES}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Low inventory medicines caching
    static async storeLowInventoryMedicines(userId: string, medicines: MedicineResponse[]): Promise<void> {
        const key = `${this.KEYS.LOW_INVENTORY}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(medicines));
    }

    static async getStoredLowInventoryMedicines(userId: string): Promise<MedicineResponse[]> {
        try {
            const key = `${this.KEYS.LOW_INVENTORY}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Sync management
    static async updateLastSync(): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    }

    static async getLastSync(): Promise<Date | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_SYNC);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Clear cache for user
    static async clearUsageCache(userId: string): Promise<void> {
        const keys = [
            `${this.KEYS.UPCOMING_INTAKES}_${userId}`,
            `${this.KEYS.OVERDUE_INTAKES}_${userId}`,
            `${this.KEYS.LOW_INVENTORY}_${userId}`,
        ];

        // Also clear daily schedules for the user
        const allKeys = await AsyncStorage.getAllKeys();
        const scheduleKeys = allKeys.filter(key =>
            key.startsWith(`${this.KEYS.DAILY_SCHEDULE}_${userId}_`)
        );

        await AsyncStorage.multiRemove([...keys, ...scheduleKeys]);
    }
}