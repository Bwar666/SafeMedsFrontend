import AsyncStorage from '@react-native-async-storage/async-storage';
import { AllergyResponse } from './AllergyTypes';

// Allergy Storage Service for basic caching
export class AllergyStorageService {
    private static readonly KEYS = {
        ALLERGIES: 'user_allergies',
        LAST_SYNC: 'allergy_last_sync',
    } as const;

    // Store allergies in cache
    static async storeAllergies(userId: string, allergies: AllergyResponse[]): Promise<void> {
        const key = `${this.KEYS.ALLERGIES}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(allergies));
        await this.updateLastSync();
    }

    // Get allergies from cache
    static async getStoredAllergies(userId: string): Promise<AllergyResponse[]> {
        try {
            const key = `${this.KEYS.ALLERGIES}_${userId}`;
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
}