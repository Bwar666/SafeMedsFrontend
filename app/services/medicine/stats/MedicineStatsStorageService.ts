// medicineStatsStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DailyMedicineSchedule,
    AdherenceStats
} from './MedicineStatsTypes';

// Medicine Stats Storage Service for offline caching
export class MedicineStatsStorageService {
    private static readonly KEYS = {
        TODAY_STATS: 'today_stats',
        WEEK_STATS: 'week_stats',
        ADHERENCE_STATS: 'adherence_stats',
        LAST_SYNC: 'stats_last_sync',
    } as const;

    // Today stats caching
    static async storeTodayStats(userId: string, stats: DailyMedicineSchedule): Promise<void> {
        const key = `${this.KEYS.TODAY_STATS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
        await this.updateLastSync();
    }

    static async getStoredTodayStats(userId: string): Promise<DailyMedicineSchedule | null> {
        try {
            const key = `${this.KEYS.TODAY_STATS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Week stats caching
    static async storeWeekStats(userId: string, stats: DailyMedicineSchedule[]): Promise<void> {
        const key = `${this.KEYS.WEEK_STATS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
    }

    static async getStoredWeekStats(userId: string): Promise<DailyMedicineSchedule[]> {
        try {
            const key = `${this.KEYS.WEEK_STATS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Adherence stats caching
    static async storeAdherenceStats(userId: string, period: string, stats: AdherenceStats): Promise<void> {
        const key = `${this.KEYS.ADHERENCE_STATS}_${userId}_${period}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
    }

    static async getStoredAdherenceStats(userId: string, period: string): Promise<AdherenceStats | null> {
        try {
            const key = `${this.KEYS.ADHERENCE_STATS}_${userId}_${period}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
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

    // Clear stats cache for user
    static async clearStatsCache(userId: string): Promise<void> {
        const allKeys = await AsyncStorage.getAllKeys();
        const userStatsKeys = allKeys.filter(key =>
                key.includes(`_${userId}`) && (
                    key.includes(this.KEYS.TODAY_STATS) ||
                    key.includes(this.KEYS.WEEK_STATS) ||
                    key.includes(this.KEYS.ADHERENCE_STATS)
                )
        );

        await AsyncStorage.multiRemove(userStatsKeys);
    }
}