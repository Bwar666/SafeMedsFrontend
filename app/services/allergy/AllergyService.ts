// allergyApi.ts - Allergy Management Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your AllergyController DTOs
export interface AllergyRequest {
    name: string;
    description?: string;
}

export interface AllergyResponse {
    id: string;
    name: string;
    description?: string;
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

// Allergy API Service Class
class AllergyApiService {
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

    // Create Allergy - POST /api/users/{userId}/allergies/create
    async createAllergy(userId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/create`, {
            method: 'POST',
            body: JSON.stringify(allergyData),
        });
    }

    // Get Allergy by ID - GET /api/users/{userId}/allergies/{allergyId}
    async getAllergyById(userId: string, allergyId: string): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/${allergyId}`, {
            method: 'GET',
        });
    }

    // Get All Allergies - GET /api/users/{userId}/allergies/all
    async getAllAllergies(userId: string): Promise<AllergyResponse[]> {
        return this.makeRequest<AllergyResponse[]>(`/api/users/${userId}/allergies/all`, {
            method: 'GET',
        });
    }

    // Update Allergy - PUT /api/users/{userId}/allergies/update/{allergyId}
    async updateAllergy(userId: string, allergyId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/update/${allergyId}`, {
            method: 'PUT',
            body: JSON.stringify(allergyData),
        });
    }

    // Delete Allergy - DELETE /api/users/{userId}/allergies/delete/{allergyId}
    async deleteAllergy(userId: string, allergyId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/allergies/delete/${allergyId}`, {
            method: 'DELETE',
        });
    }
}

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

    // Get last sync timestamp
    static async getLastSync(): Promise<Date | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_SYNC);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Clear allergy cache for user
    static async clearAllergyCache(userId: string): Promise<void> {
        const key = `${this.KEYS.ALLERGIES}_${userId}`;
        await AsyncStorage.removeItem(key);
    }
}

// High-level Allergy Service with caching and offline support
export class AllergyService {
    private apiService: AllergyApiService;

    constructor() {
        this.apiService = new AllergyApiService();
    }

    // Get all allergies with caching
    async getAllergies(userId: string, useCache: boolean = true): Promise<AllergyResponse[]> {
        try {
            const allergies = await this.apiService.getAllAllergies(userId);
            await AllergyStorageService.storeAllergies(userId, allergies);
            return allergies;
        } catch (error) {
            if (useCache) {
                console.log('Using cached allergies due to network error');
                return await AllergyStorageService.getStoredAllergies(userId);
            }
            throw error;
        }
    }

    // Get single allergy by ID
    async getAllergyById(userId: string, allergyId: string): Promise<AllergyResponse> {
        return this.apiService.getAllergyById(userId, allergyId);
    }

    // Create new allergy
    async createAllergy(userId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        // Validate input
        const validation = this.validateAllergyRequest(allergyData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        const allergy = await this.apiService.createAllergy(userId, allergyData);

        // Update cache with new allergy
        const cachedAllergies = await AllergyStorageService.getStoredAllergies(userId);
        cachedAllergies.push(allergy);
        await AllergyStorageService.storeAllergies(userId, cachedAllergies);

        return allergy;
    }

    // Update existing allergy
    async updateAllergy(userId: string, allergyId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        // Validate input
        const validation = this.validateAllergyRequest(allergyData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        const updatedAllergy = await this.apiService.updateAllergy(userId, allergyId, allergyData);

        // Update cache
        const cachedAllergies = await AllergyStorageService.getStoredAllergies(userId);
        const index = cachedAllergies.findIndex(a => a.id === allergyId);
        if (index !== -1) {
            cachedAllergies[index] = updatedAllergy;
            await AllergyStorageService.storeAllergies(userId, cachedAllergies);
        }

        return updatedAllergy;
    }

    // Delete allergy
    async deleteAllergy(userId: string, allergyId: string): Promise<void> {
        await this.apiService.deleteAllergy(userId, allergyId);

        // Remove from cache
        const cachedAllergies = await AllergyStorageService.getStoredAllergies(userId);
        const filteredAllergies = cachedAllergies.filter(a => a.id !== allergyId);
        await AllergyStorageService.storeAllergies(userId, filteredAllergies);
    }

    // Utility methods
    async refreshAllergies(userId: string): Promise<AllergyResponse[]> {
        return this.getAllergies(userId, false);
    }

    async clearCache(userId: string): Promise<void> {
        await AllergyStorageService.clearAllergyCache(userId);
    }

    async getCachedAllergies(userId: string): Promise<AllergyResponse[]> {
        return AllergyStorageService.getStoredAllergies(userId);
    }

    async hasCachedData(userId: string): Promise<boolean> {
        const allergies = await AllergyStorageService.getStoredAllergies(userId);
        return allergies.length > 0;
    }

    async getLastSyncTime(): Promise<Date | null> {
        return AllergyStorageService.getLastSync();
    }

    // Check if user has specific allergy
    async hasAllergy(userId: string, allergyName: string, useCache: boolean = true): Promise<boolean> {
        const allergies = await this.getAllergies(userId, useCache);
        return allergies.some(allergy =>
            allergy.name.toLowerCase() === allergyName.toLowerCase()
        );
    }

    // Get allergy count
    async getAllergyCount(userId: string, useCache: boolean = true): Promise<number> {
        const allergies = await this.getAllergies(userId, useCache);
        return allergies.length;
    }

    // Search allergies by name
    async searchAllergiesByName(userId: string, searchTerm: string, useCache: boolean = true): Promise<AllergyResponse[]> {
        const allergies = await this.getAllergies(userId, useCache);
        const lowerSearchTerm = searchTerm.toLowerCase();

        return allergies.filter(allergy =>
            allergy.name.toLowerCase().includes(lowerSearchTerm) ||
            (allergy.description && allergy.description.toLowerCase().includes(lowerSearchTerm))
        );
    }

    // Get allergies grouped by first letter (for UI organization)
    async getAllergiesGrouped(userId: string, useCache: boolean = true): Promise<{ [letter: string]: AllergyResponse[] }> {
        const allergies = await this.getAllergies(userId, useCache);

        return allergies.reduce((groups, allergy) => {
            const firstLetter = allergy.name.charAt(0).toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(allergy);
            return groups;
        }, {} as { [letter: string]: AllergyResponse[] });
    }

    // Validate allergy request
    validateAllergyRequest(request: AllergyRequest): { isValid: boolean; error?: string } {
        if (!request.name || request.name.trim().length === 0) {
            return { isValid: false, error: 'Allergy name is required' };
        }

        if (request.name.length > 100) {
            return { isValid: false, error: 'Allergy name is too long (max 100 characters)' };
        }

        if (request.description && request.description.length > 500) {
            return { isValid: false, error: 'Description is too long (max 500 characters)' };
        }

        return { isValid: true };
    }

    // Check for duplicate allergy names
    async isDuplicateAllergy(userId: string, allergyName: string, excludeId?: string): Promise<boolean> {
        const allergies = await this.getAllergies(userId, true);

        return allergies.some(allergy =>
            allergy.name.toLowerCase() === allergyName.toLowerCase() &&
            allergy.id !== excludeId
        );
    }

    // Bulk operations
    async createMultipleAllergies(userId: string, allergyDataList: AllergyRequest[]): Promise<AllergyResponse[]> {
        const results: AllergyResponse[] = [];

        for (const allergyData of allergyDataList) {
            try {
                const allergy = await this.createAllergy(userId, allergyData);
                results.push(allergy);
            } catch (error) {
                console.error(`Failed to create allergy ${allergyData.name}:`, error);
                // Continue with other allergies
            }
        }

        return results;
    }

    // Format allergy for display
    formatAllergyForDisplay(allergy: AllergyResponse): string {
        if (allergy.description) {
            return `${allergy.name} - ${allergy.description}`;
        }
        return allergy.name;
    }
}

// Export singleton instance
export const allergyService = new AllergyService();