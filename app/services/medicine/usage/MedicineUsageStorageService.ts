import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DailyMedicineSchedule,
    IntakeEvent,
    MedicineResponse
} from './MedicineUsageTypes';

export class MedicineUsageStorageService {
    private static readonly KEYS = {
        DAILY_SCHEDULE: 'daily_schedule',
        UPCOMING_INTAKES: 'upcoming_intakes',
        OVERDUE_INTAKES: 'overdue_intakes',
        LOW_INVENTORY: 'low_inventory_medicines',
        LAST_SYNC: 'usage_last_sync',
    } as const;

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

    static async updateLastSync(): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    }
}