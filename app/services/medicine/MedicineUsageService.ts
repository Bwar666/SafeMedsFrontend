// medicineUsageApi.ts - Medicine Usage, Schedules, and Inventory Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your MedicineUsageController DTOs
export interface TakeMedicineRequest {
    intakeEventId: string;
    actualTakeTime?: string; // ISO datetime string
    actualDosageAmount?: number;
    note?: string;
    deductFromInventory?: boolean;
}

export interface SkipMedicineRequest {
    intakeEventId: string;
    skipReason: string;
    note?: string;
}

export interface PauseMedicineRequest {
    pauseReason: string;
    resumeAt?: string; // ISO datetime string
    pauseNotifications?: boolean;
}

export interface MedicineUsageResponse {
    intakeEventId: string;
    medicineId: string;
    medicineName: string;
    status: IntakeStatus;
    scheduledDateTime: string;
    actualDateTime?: string;
    scheduledAmount: number;
    actualAmount?: number;
    note?: string;
    skipReason?: string;
    remainingInventory?: number;
    inventoryLow?: boolean;
    message?: string;
}

export interface IntakeEvent {
    id: string;
    medicineId: string;
    medicineName: string;
    medicineIcon?: string;
    medicineColor?: string;
    scheduledDateTime: string;
    actualDateTime?: string;
    status: IntakeStatus;
    scheduledAmount: number;
    actualAmount?: number;
    note?: string;
    skipReason?: string;
    canTakeLate?: boolean;
    inventoryAvailable?: boolean;
    formattedDosage?: string;
}

export interface DailyMedicineSchedule {
    date: string; // YYYY-MM-DD format
    intakeEvents: IntakeEvent[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    totalPending: number;
}

export interface InventoryUpdateRequest {
    newInventoryAmount: number;
    updateReason?: string;
    resetToFull?: boolean;
}

export interface MedicineResponse {
    id: string;
    name: string;
    form: string;
    conditionReason?: string;
    frequencyType: string;
    intakeTimes: string[];
    scheduleDuration?: number;
    refillReminderThreshold?: number;
    foodInstruction?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    formattedDosage?: string;
}

// Enums
export enum IntakeStatus {
    SCHEDULED = 'SCHEDULED',
    TAKEN = 'TAKEN',
    MISSED = 'MISSED',
    SKIPPED = 'SKIPPED'
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

// Medicine Usage API Service Class
class MedicineUsageApiService {
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

    // Medicine Usage Operations
    // Take Medicine - POST /api/users/{userId}/medicines/take
    async takeMedicine(userId: string, request: TakeMedicineRequest): Promise<MedicineUsageResponse> {
        return this.makeRequest<MedicineUsageResponse>(`/api/users/${userId}/medicines/take`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Skip Medicine - POST /api/users/{userId}/medicines/skip
    async skipMedicine(userId: string, request: SkipMedicineRequest): Promise<MedicineUsageResponse> {
        return this.makeRequest<MedicineUsageResponse>(`/api/users/${userId}/medicines/skip`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Pause Medicine - POST /api/users/{userId}/medicines/{medicineId}/pause
    async pauseMedicine(userId: string, medicineId: string, request: PauseMedicineRequest): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/pause`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Resume Medicine - POST /api/users/{userId}/medicines/{medicineId}/resume
    async resumeMedicine(userId: string, medicineId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/resume`, {
            method: 'POST',
        });
    }

    // Toggle Notifications - PUT /api/users/{userId}/medicines/{medicineId}/notifications
    async toggleNotifications(userId: string, medicineId: string, enabled: boolean): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/notifications?enabled=${enabled}`, {
            method: 'PUT',
        });
    }

    // Schedule Operations
    // Get Daily Schedule - GET /api/users/{userId}/medicines/schedule/daily
    async getDailySchedule(userId: string, date: string): Promise<DailyMedicineSchedule> {
        return this.makeRequest<DailyMedicineSchedule>(`/api/users/${userId}/medicines/schedule/daily?date=${date}`, {
            method: 'GET',
        });
    }

    // Get Weekly Schedule - GET /api/users/{userId}/medicines/schedule/weekly
    async getWeeklySchedule(userId: string, startDate: string): Promise<DailyMedicineSchedule[]> {
        return this.makeRequest<DailyMedicineSchedule[]>(`/api/users/${userId}/medicines/schedule/weekly?startDate=${startDate}`, {
            method: 'GET',
        });
    }

    // Get Upcoming Intakes - GET /api/users/{userId}/medicines/upcoming
    async getUpcomingIntakes(userId: string, hours: number = 24): Promise<IntakeEvent[]> {
        return this.makeRequest<IntakeEvent[]>(`/api/users/${userId}/medicines/upcoming?hours=${hours}`, {
            method: 'GET',
        });
    }

    // Get Overdue Intakes - GET /api/users/{userId}/medicines/overdue
    async getOverdueIntakes(userId: string): Promise<IntakeEvent[]> {
        return this.makeRequest<IntakeEvent[]>(`/api/users/${userId}/medicines/overdue`, {
            method: 'GET',
        });
    }

    // Inventory Operations
    // Update Inventory - PUT /api/users/{userId}/medicines/{medicineId}/inventory
    async updateInventory(userId: string, medicineId: string, request: InventoryUpdateRequest): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/inventory`, {
            method: 'PUT',
            body: JSON.stringify(request),
        });
    }

    // Get Low Inventory Medicines - GET /api/users/{userId}/medicines/low-inventory
    async getLowInventoryMedicines(userId: string): Promise<MedicineResponse[]> {
        return this.makeRequest<MedicineResponse[]>(`/api/users/${userId}/medicines/low-inventory`, {
            method: 'GET',
        });
    }

    // Maintenance Operations
    // Process Missed Doses - POST /api/users/{userId}/medicines/process-missed
    async processMissedDoses(userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/process-missed`, {
            method: 'POST',
        });
    }

    // Mark Event as Missed - POST /api/users/{userId}/medicines/events/{intakeEventId}/mark-missed
    async markEventAsMissed(userId: string, intakeEventId: string, automatic: boolean = false): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/events/${intakeEventId}/mark-missed?automatic=${automatic}`, {
            method: 'POST',
        });
    }
}

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

// High-level Medicine Usage Service with caching and offline support
export class MedicineUsageService {
    private apiService: MedicineUsageApiService;

    constructor() {
        this.apiService = new MedicineUsageApiService();
    }

    // Medicine Usage Operations
    async takeMedicine(userId: string, request: TakeMedicineRequest): Promise<MedicineUsageResponse> {
        const response = await this.apiService.takeMedicine(userId, request);

        // Clear relevant caches to force refresh
        await this.invalidateScheduleCache(userId);

        return response;
    }

    async skipMedicine(userId: string, request: SkipMedicineRequest): Promise<MedicineUsageResponse> {
        const response = await this.apiService.skipMedicine(userId, request);

        // Clear relevant caches
        await this.invalidateScheduleCache(userId);

        return response;
    }

    async pauseMedicine(userId: string, medicineId: string, request: PauseMedicineRequest): Promise<void> {
        await this.apiService.pauseMedicine(userId, medicineId, request);
        await this.invalidateScheduleCache(userId);
    }

    async resumeMedicine(userId: string, medicineId: string): Promise<void> {
        await this.apiService.resumeMedicine(userId, medicineId);
        await this.invalidateScheduleCache(userId);
    }

    async toggleNotifications(userId: string, medicineId: string, enabled: boolean): Promise<void> {
        return this.apiService.toggleNotifications(userId, medicineId, enabled);
    }

    // Schedule Operations with caching
    async getDailySchedule(userId: string, date: string, useCache: boolean = true): Promise<DailyMedicineSchedule> {
        try {
            const schedule = await this.apiService.getDailySchedule(userId, date);
            await MedicineUsageStorageService.storeDailySchedule(userId, date, schedule);
            return schedule;
        } catch (error) {
            if (useCache) {
                console.log('Using cached daily schedule due to network error');
                const cached = await MedicineUsageStorageService.getStoredDailySchedule(userId, date);
                if (cached) return cached;
            }
            throw error;
        }
    }

    async getTodaySchedule(userId: string, useCache: boolean = true): Promise<DailyMedicineSchedule> {
        const today = new Date().toISOString().split('T')[0];
        return this.getDailySchedule(userId, today, useCache);
    }

    async getWeeklySchedule(userId: string, startDate: string): Promise<DailyMedicineSchedule[]> {
        return this.apiService.getWeeklySchedule(userId, startDate);
    }

    async getUpcomingIntakes(userId: string, hours: number = 24, useCache: boolean = true): Promise<IntakeEvent[]> {
        try {
            const intakes = await this.apiService.getUpcomingIntakes(userId, hours);
            await MedicineUsageStorageService.storeUpcomingIntakes(userId, intakes);
            return intakes;
        } catch (error) {
            if (useCache) {
                console.log('Using cached upcoming intakes due to network error');
                return await MedicineUsageStorageService.getStoredUpcomingIntakes(userId);
            }
            throw error;
        }
    }

    async getOverdueIntakes(userId: string, useCache: boolean = true): Promise<IntakeEvent[]> {
        try {
            const intakes = await this.apiService.getOverdueIntakes(userId);
            await MedicineUsageStorageService.storeOverdueIntakes(userId, intakes);
            return intakes;
        } catch (error) {
            if (useCache) {
                console.log('Using cached overdue intakes due to network error');
                return await MedicineUsageStorageService.getStoredOverdueIntakes(userId);
            }
            throw error;
        }
    }

    // Inventory Operations
    async updateInventory(userId: string, medicineId: string, request: InventoryUpdateRequest): Promise<void> {
        await this.apiService.updateInventory(userId, medicineId, request);

        // Clear low inventory cache to refresh
        const key = `low_inventory_medicines_${userId}`;
        await AsyncStorage.removeItem(key);
    }

    async getLowInventoryMedicines(userId: string, useCache: boolean = true): Promise<MedicineResponse[]> {
        try {
            const medicines = await this.apiService.getLowInventoryMedicines(userId);
            await MedicineUsageStorageService.storeLowInventoryMedicines(userId, medicines);
            return medicines;
        } catch (error) {
            if (useCache) {
                console.log('Using cached low inventory medicines due to network error');
                return await MedicineUsageStorageService.getStoredLowInventoryMedicines(userId);
            }
            throw error;
        }
    }

    // Maintenance Operations
    async processMissedDoses(userId: string): Promise<void> {
        await this.apiService.processMissedDoses(userId);
        await this.invalidateScheduleCache(userId);
    }

    async markEventAsMissed(userId: string, intakeEventId: string, automatic: boolean = false): Promise<void> {
        await this.apiService.markEventAsMissed(userId, intakeEventId, automatic);
        await this.invalidateScheduleCache(userId);
    }

    // Utility Methods
    async refreshAllUsageData(userId: string): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            await Promise.all([
                this.getDailySchedule(userId, today, false),
                this.getUpcomingIntakes(userId, 24, false),
                this.getOverdueIntakes(userId, false),
                this.getLowInventoryMedicines(userId, false),
            ]);
        } catch (error) {
            console.error('Error refreshing usage data:', error);
            throw error;
        }
    }

    async clearCache(userId: string): Promise<void> {
        await MedicineUsageStorageService.clearUsageCache(userId);
    }

    async getLastSyncTime(): Promise<Date | null> {
        return MedicineUsageStorageService.getLastSync();
    }

    // Get cached data only
    async getCachedTodaySchedule(userId: string): Promise<DailyMedicineSchedule | null> {
        const today = new Date().toISOString().split('T')[0];
        return MedicineUsageStorageService.getStoredDailySchedule(userId, today);
    }

    async getCachedUpcomingIntakes(userId: string): Promise<IntakeEvent[]> {
        return MedicineUsageStorageService.getStoredUpcomingIntakes(userId);
    }

    async getCachedOverdueIntakes(userId: string): Promise<IntakeEvent[]> {
        return MedicineUsageStorageService.getStoredOverdueIntakes(userId);
    }

    async getCachedLowInventoryMedicines(userId: string): Promise<MedicineResponse[]> {
        return MedicineUsageStorageService.getStoredLowInventoryMedicines(userId);
    }

    // Helper method to invalidate schedule-related caches
    private async invalidateScheduleCache(userId: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        // Clear today's schedule cache
        const todayKey = `daily_schedule_${userId}_${today}`;
        await AsyncStorage.removeItem(todayKey);

        // Clear upcoming and overdue intakes cache
        await Promise.all([
            AsyncStorage.removeItem(`upcoming_intakes_${userId}`),
            AsyncStorage.removeItem(`overdue_intakes_${userId}`)
        ]);
    }

    // Check if there are any overdue intakes
    async hasOverdueIntakes(userId: string, useCache: boolean = true): Promise<boolean> {
        const overdueIntakes = await this.getOverdueIntakes(userId, useCache);
        return overdueIntakes.length > 0;
    }

    // Get count of pending intakes for today
    async getTodayPendingCount(userId: string, useCache: boolean = true): Promise<number> {
        const todaySchedule = await this.getTodaySchedule(userId, useCache);
        return todaySchedule.totalPending;
    }

    // Get adherence rate for today
    async getTodayAdherenceRate(userId: string, useCache: boolean = true): Promise<number> {
        const todaySchedule = await this.getTodaySchedule(userId, useCache);
        const { totalScheduled, totalTaken } = todaySchedule;

        if (totalScheduled === 0) return 0;
        return Math.round((totalTaken / totalScheduled) * 100);
    }

    // Check if any medicines need refill
    async needsInventoryRefill(userId: string, useCache: boolean = true): Promise<boolean> {
        const lowInventoryMedicines = await this.getLowInventoryMedicines(userId, useCache);
        return lowInventoryMedicines.length > 0;
    }

    // Get intake events by status for today
    async getTodayIntakesByStatus(userId: string, status: IntakeStatus, useCache: boolean = true): Promise<IntakeEvent[]> {
        const todaySchedule = await this.getTodaySchedule(userId, useCache);
        return todaySchedule.intakeEvents.filter(event => event.status === status);
    }

    // Validate take medicine request
    validateTakeMedicineRequest(request: TakeMedicineRequest): { isValid: boolean; error?: string } {
        if (!request.intakeEventId) {
            return { isValid: false, error: 'Intake event ID is required' };
        }

        if (request.actualDosageAmount !== undefined && request.actualDosageAmount <= 0) {
            return { isValid: false, error: 'Dosage amount must be positive' };
        }

        if (request.actualTakeTime) {
            const takeTime = new Date(request.actualTakeTime);
            if (isNaN(takeTime.getTime())) {
                return { isValid: false, error: 'Invalid take time format' };
            }
        }

        return { isValid: true };
    }

    // Validate skip medicine request
    validateSkipMedicineRequest(request: SkipMedicineRequest): { isValid: boolean; error?: string } {
        if (!request.intakeEventId) {
            return { isValid: false, error: 'Intake event ID is required' };
        }

        if (!request.skipReason || request.skipReason.trim().length === 0) {
            return { isValid: false, error: 'Skip reason is required' };
        }

        return { isValid: true };
    }

    // Validate pause medicine request
    validatePauseMedicineRequest(request: PauseMedicineRequest): { isValid: boolean; error?: string } {
        if (!request.pauseReason || request.pauseReason.trim().length === 0) {
            return { isValid: false, error: 'Pause reason is required' };
        }

        if (request.resumeAt) {
            const resumeTime = new Date(request.resumeAt);
            if (isNaN(resumeTime.getTime())) {
                return { isValid: false, error: 'Invalid resume time format' };
            }

            if (resumeTime <= new Date()) {
                return { isValid: false, error: 'Resume time must be in the future' };
            }
        }

        return { isValid: true };
    }

    // Validate inventory update request
    validateInventoryUpdateRequest(request: InventoryUpdateRequest): { isValid: boolean; error?: string } {
        if (request.newInventoryAmount === undefined || request.newInventoryAmount === null) {
            return { isValid: false, error: 'New inventory amount is required' };
        }

        if (request.newInventoryAmount < 0) {
            return { isValid: false, error: 'Inventory amount cannot be negative' };
        }

        return { isValid: true };
    }
}

// Export singleton instance
export const medicineUsageService = new MedicineUsageService();
export const medicineUsageApiService = new MedicineUsageApiService();