// medicineStorage.ts - Medicine Storage Service for offline caching
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicineResponse } from './MedicineServiceTypes';

export class MedicineStorageService {
    private static readonly KEYS = {
        MEDICINES: 'user_medicines',
        LAST_SYNC: 'medicine_last_sync',
    } as const;

    // Store medicines in cache
    static async storeMedicines(userId: string, medicines: MedicineResponse[]): Promise<void> {
        const key = `${this.KEYS.MEDICINES}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(medicines));
        await this.updateLastSync();
    }

    // Get medicines from cache
    static async getStoredMedicines(userId: string): Promise<MedicineResponse[]> {
        try {
            const key = `${this.KEYS.MEDICINES}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Update last sync timestamp
    static async updateLastSync(): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    }

    // Get last sync timestamp
    static async getLastSync(): Promise<Date | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_SYNC);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Clear medicine cache for user
    static async clearMedicineCache(userId: string): Promise<void> {
        const key = `${this.KEYS.MEDICINES}_${userId}`;
        await AsyncStorage.removeItem(key);
    }
}