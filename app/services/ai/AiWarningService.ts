// aiWarningApi.ts - AI Warning Service (Clean Version)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your AiWarningController DTOs
export interface AiEvaluationResponse {
    id: string;
    medicineName: string;
    riskType: AiWarningType;
    allergyName?: string;
    targetMedicineName?: string;
    message: string;
    severity: WarningSeverity;
    status: AiWarningStatus;
    source: AiWarningSource;
    details?: string;
    createdAt: string;
}

export interface AiWarningResponse {
    id: string;
    seen: boolean;
    resolved: boolean;
    medicineName: string;
    allergyName?: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
    evaluationResult: AiEvaluationResponse;
}

// Enums matching your backend
export enum AiWarningType {
    ALLERGY_CONFLICT = 'ALLERGY_CONFLICT',
    INTERACTION_CONFLICT = 'INTERACTION_CONFLICT',
    OVERDOSE_WARNING = 'OVERDOSE_WARNING',
    DUPLICATE_MEDICINE = 'DUPLICATE_MEDICINE',
    TIMING_CONFLICT = 'TIMING_CONFLICT',
    FOOD_INSTRUCTION_ISSUE = 'FOOD_INSTRUCTION_ISSUE',
    NO_RISK = 'NO_RISK'
}

export enum WarningSeverity {
    LOW = 'LOW',
    MODERATE = 'MODERATE',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum AiWarningStatus {
    PENDING = 'PENDING',
    FAILED = 'FAILED',
    COMPLETED = 'COMPLETED'
}

export enum AiWarningSource {
    AI = 'AI',
    MANUAL = 'MANUAL',
    FALLBACK = 'FALLBACK'
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

// AI Warning API Service Class
class AiWarningApiService {
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

    // Get User Warnings - GET /api/ai/warnings/user/{userId}
    async getUserWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}`, {
            method: 'GET',
        });
    }

    // Get Unseen Warnings - GET /api/ai/warnings/user/{userId}/unseen
    async getUnseenWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/unseen`, {
            method: 'GET',
        });
    }

    // Get Urgent Warnings - GET /api/ai/warnings/user/{userId}/urgent
    async getUrgentWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/urgent`, {
            method: 'GET',
        });
    }

    // Get Warnings for Medicine - GET /api/ai/warnings/user/{userId}/medicine/{medicineId}
    async getWarningsForMedicine(userId: string, medicineId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/medicine/${medicineId}`, {
            method: 'GET',
        });
    }

    // Mark as Seen - PUT /api/ai/warnings/{warningId}/seen
    async markAsSeen(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}/seen?userId=${userId}`, {
            method: 'PUT',
        });
    }

    // Mark as Resolved - PUT /api/ai/warnings/{warningId}/resolved
    async markAsResolved(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}/resolved?userId=${userId}`, {
            method: 'PUT',
        });
    }

    // Delete Warning - DELETE /api/ai/warnings/{warningId}
    async deleteWarning(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}?userId=${userId}`, {
            method: 'DELETE',
        });
    }
}

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

    // Store urgent warnings
    static async storeUrgentWarnings(userId: string, warnings: AiWarningResponse[]): Promise<void> {
        const key = `${this.KEYS.URGENT_WARNINGS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(warnings));
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

    // Get last sync
    static async getLastSync(): Promise<Date | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_SYNC);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Clear cache
    static async clearWarningsCache(userId: string): Promise<void> {
        const keys = [
            `${this.KEYS.ALL_WARNINGS}_${userId}`,
            `${this.KEYS.UNSEEN_WARNINGS}_${userId}`,
            `${this.KEYS.URGENT_WARNINGS}_${userId}`,
        ];
        await AsyncStorage.multiRemove(keys);
    }
}

// High-level AI Warning Service
export class AiWarningService {
    private apiService: AiWarningApiService;

    constructor() {
        this.apiService = new AiWarningApiService();
    }

    // Get all warnings with caching
    async getAllWarnings(userId: string, useCache: boolean = true): Promise<AiWarningResponse[]> {
        try {
            const warnings = await this.apiService.getUserWarnings(userId);
            await AiWarningStorageService.storeAllWarnings(userId, warnings);
            return warnings;
        } catch (error) {
            if (useCache) {
                console.log('Using cached warnings due to network error');
                return await AiWarningStorageService.getStoredAllWarnings(userId);
            }
            throw error;
        }
    }

    // Get unseen warnings with caching
    async getUnseenWarnings(userId: string, useCache: boolean = true): Promise<AiWarningResponse[]> {
        try {
            const warnings = await this.apiService.getUnseenWarnings(userId);
            await AiWarningStorageService.storeUnseenWarnings(userId, warnings);
            return warnings;
        } catch (error) {
            if (useCache) {
                console.log('Using cached unseen warnings due to network error');
                return await AiWarningStorageService.getStoredUnseenWarnings(userId);
            }
            throw error;
        }
    }

    // Get urgent warnings with caching
    async getUrgentWarnings(userId: string, useCache: boolean = true): Promise<AiWarningResponse[]> {
        try {
            const warnings = await this.apiService.getUrgentWarnings(userId);
            await AiWarningStorageService.storeUrgentWarnings(userId, warnings);
            return warnings;
        } catch (error) {
            if (useCache) {
                console.log('Using cached urgent warnings due to network error');
                return await AiWarningStorageService.getStoredUrgentWarnings(userId);
            }
            throw error;
        }
    }

    // Get warnings for specific medicine
    async getWarningsForMedicine(userId: string, medicineId: string): Promise<AiWarningResponse[]> {
        return this.apiService.getWarningsForMedicine(userId, medicineId);
    }

    // Mark warning as seen with cache update
    async markWarningAsSeen(warningId: string, userId: string): Promise<void> {
        await this.apiService.markAsSeen(warningId, userId);

        // Update cached warnings to reflect the change
        await this.updateWarningInCache(userId, warningId, { seen: true });

        // Refresh unseen warnings cache
        try {
            const unseenWarnings = await this.apiService.getUnseenWarnings(userId);
            await AiWarningStorageService.storeUnseenWarnings(userId, unseenWarnings);
        } catch (error) {
            console.log('Failed to refresh unseen warnings cache:', error);
        }
    }

    // Mark warning as resolved with cache update
    async markWarningAsResolved(warningId: string, userId: string): Promise<void> {
        await this.apiService.markAsResolved(warningId, userId);

        // Update cached warnings
        await this.updateWarningInCache(userId, warningId, {
            resolved: true,
            resolvedAt: new Date().toISOString()
        });
    }

    // Delete warning with cache update
    async deleteWarning(warningId: string, userId: string): Promise<void> {
        await this.apiService.deleteWarning(warningId, userId);

        // Remove from all caches
        await this.removeWarningFromCache(userId, warningId);
    }

    // Utility methods
    async refreshAllWarnings(userId: string): Promise<void> {
        try {
            await Promise.all([
                this.getAllWarnings(userId, false),
                this.getUnseenWarnings(userId, false),
                this.getUrgentWarnings(userId, false),
            ]);
        } catch (error) {
            console.error('Error refreshing warnings data:', error);
            throw error;
        }
    }

    async clearCache(userId: string): Promise<void> {
        await AiWarningStorageService.clearWarningsCache(userId);
    }

    async getLastSyncTime(): Promise<Date | null> {
        return AiWarningStorageService.getLastSync();
    }

    // Get cached data only
    async getCachedAllWarnings(userId: string): Promise<AiWarningResponse[]> {
        return AiWarningStorageService.getStoredAllWarnings(userId);
    }

    async getCachedUnseenWarnings(userId: string): Promise<AiWarningResponse[]> {
        return AiWarningStorageService.getStoredUnseenWarnings(userId);
    }

    async getCachedUrgentWarnings(userId: string): Promise<AiWarningResponse[]> {
        return AiWarningStorageService.getStoredUrgentWarnings(userId);
    }

    // Quick utility methods for UI
    async getUnseenWarningsCount(userId: string, useCache: boolean = true): Promise<number> {
        const unseenWarnings = await this.getUnseenWarnings(userId, useCache);
        return unseenWarnings.length;
    }

    async hasUrgentWarnings(userId: string, useCache: boolean = true): Promise<boolean> {
        const urgentWarnings = await this.getUrgentWarnings(userId, useCache);
        return urgentWarnings.length > 0;
    }

    async hasCriticalWarnings(userId: string, useCache: boolean = true): Promise<boolean> {
        const allWarnings = await this.getAllWarnings(userId, useCache);
        return allWarnings.some(w => w.evaluationResult.severity === WarningSeverity.CRITICAL);
    }

    // Helper methods for cache management
    private async updateWarningInCache(userId: string, warningId: string, updates: Partial<AiWarningResponse>): Promise<void> {
        try {
            // Update all warnings cache
            const allWarnings = await AiWarningStorageService.getStoredAllWarnings(userId);
            const index = allWarnings.findIndex(w => w.id === warningId);
            if (index !== -1) {
                allWarnings[index] = { ...allWarnings[index], ...updates };
                await AiWarningStorageService.storeAllWarnings(userId, allWarnings);
            }

            // Update unseen warnings cache if marking as seen
            if (updates.seen === true) {
                const unseenWarnings = await AiWarningStorageService.getStoredUnseenWarnings(userId);
                const filteredUnseen = unseenWarnings.filter(w => w.id !== warningId);
                await AiWarningStorageService.storeUnseenWarnings(userId, filteredUnseen);
            }
        } catch (error) {
            console.log('Failed to update warning in cache:', error);
        }
    }

    private async removeWarningFromCache(userId: string, warningId: string): Promise<void> {
        try {
            // Remove from all caches
            const allWarnings = await AiWarningStorageService.getStoredAllWarnings(userId);
            const filteredAll = allWarnings.filter(w => w.id !== warningId);
            await AiWarningStorageService.storeAllWarnings(userId, filteredAll);

            const unseenWarnings = await AiWarningStorageService.getStoredUnseenWarnings(userId);
            const filteredUnseen = unseenWarnings.filter(w => w.id !== warningId);
            await AiWarningStorageService.storeUnseenWarnings(userId, filteredUnseen);

            const urgentWarnings = await AiWarningStorageService.getStoredUrgentWarnings(userId);
            const filteredUrgent = urgentWarnings.filter(w => w.id !== warningId);
            await AiWarningStorageService.storeUrgentWarnings(userId, filteredUrgent);
        } catch (error) {
            console.log('Failed to remove warning from cache:', error);
        }
    }
}

// Export singleton instance
export const aiWarningService = new AiWarningService();