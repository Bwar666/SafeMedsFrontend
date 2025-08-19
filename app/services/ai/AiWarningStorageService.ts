import AsyncStorage from '@react-native-async-storage/async-storage';
import { AiWarningResponse } from './AiWarningTypes';

// AI Warning Storage Service for basic caching
export class AiWarningStorageService {
    private static readonly KEYS = {
        ALL_WARNINGS: 'ai_warnings_all',
        UNSEEN_WARNINGS: 'ai_warnings_unseen',
        URGENT_WARNINGS: 'ai_warnings_urgent',
        LAST_SYNC: 'ai_warnings_last_sync',
    } as const;

    // Store all warnings
    static async storeAllWarnings(userId: string, warnings: AiWarningResponse[]): Promise<void> {
        const key = `${this.KEYS.ALL_WARNINGS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(warnings));
        await this.updateLastSync();
    }

    // Get stored warnings
    static async getStoredAllWarnings(userId: string): Promise<AiWarningResponse[]> {
        try {
            const key = `${this.KEYS.ALL_WARNINGS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Store unseen warnings
    static async storeUnseenWarnings(userId: string, warnings: AiWarningResponse[]): Promise<void> {
        const key = `${this.KEYS.UNSEEN_WARNINGS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(warnings));
    }

    // Get stored unseen warnings
    static async getStoredUnseenWarnings(userId: string): Promise<AiWarningResponse[]> {
        try {
            const key = `${this.KEYS.UNSEEN_WARNINGS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Get stored urgent warnings
    static async getStoredUrgentWarnings(userId: string): Promise<AiWarningResponse[]> {
        try {
            const key = `${this.KEYS.URGENT_WARNINGS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Update last sync
    static async updateLastSync(): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    }
}