// userStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeMedUser } from './UserTypes';

// User Storage Service
export class UserStorageService {
    private static readonly KEYS = {
        USER: 'user_profile',
        PROFILE_CREATED: 'profile_created',
        USER_ID: 'user_id',
    } as const;

    static async storeUser(user: SafeMedUser): Promise<void> {
        const entries: [string, string][] = [
            [this.KEYS.USER, JSON.stringify(user)],
            [this.KEYS.USER_ID, user.id],
            [this.KEYS.PROFILE_CREATED, 'true'],
        ];
        await AsyncStorage.multiSet(entries);
    }

    static async getStoredUser(): Promise<SafeMedUser | null> {
        try {
            const userData = await AsyncStorage.getItem(this.KEYS.USER);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    static async getStoredUserId(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.KEYS.USER_ID);
        } catch {
            return null;
        }
    }

    static async isProfileCreated(): Promise<boolean> {
        try {
            const created = await AsyncStorage.getItem(this.KEYS.PROFILE_CREATED);
            return created === 'true';
        } catch {
            return false;
        }
    }

    static async clearUserData(): Promise<void> {
        await AsyncStorage.multiRemove(Object.values(this.KEYS));
    }

    static async updateStoredUser(updatedUser: SafeMedUser): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.USER, JSON.stringify(updatedUser));
    }
}