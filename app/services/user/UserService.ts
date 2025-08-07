import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions
export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate: string;
    languagePreference: 'ENGLISH' | 'ARABIC' | 'KURDISH';
    themePreference: 'LIGHT' | 'DARK';
    allergies: Array<{
        name: string;
        description: string;
    }>;
}

export interface SafeMedUser {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate: string;
    languagePreference: 'ENGLISH' | 'ARABIC' | 'KURDISH';
    themePreference: 'LIGHT' | 'DARK';
    allergies: Array<{
        id: string;
        name: string;
        description: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}

// API Response Handler
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

// API Service Class
class UserService {
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

    async createUser(userData: CreateUserRequest): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>('/api/users/create', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getUser(userId: string): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>(`/api/users/${userId}`, {
            method: 'GET',
        });
    }

    async updateUser(userId: string, userData: Partial<CreateUserRequest>): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(userId: string): Promise<{ success: boolean }> {
        return this.makeRequest<{ success: boolean }>(`/api/users/${userId}`, {
            method: 'DELETE',
        });
    }
}

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

// Export singleton instance
export const userService = new UserService();