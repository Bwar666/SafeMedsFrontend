// medicineApi.ts - Medicine CRUD Operations Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your MedicineController DTOs
export interface MedicineRequest {
    name: string;
    form: MedicineForm;
    conditionReason?: string;
    frequencyType: FrequencyType;
    frequencyConfig?: FrequencyConfig;
    intakeTimes: string[]; // LocalTime as string in HH:mm format
    intakeSchedules: IntakeSchedule[];
    scheduleDuration?: number;
    relatedAllergyIds?: string[];
    refillReminderThreshold?: number;
    foodInstruction?: FoodInstruction;
    icon?: string;
    color?: string;
}

export interface MedicineResponse {
    id: string;
    name: string;
    form: MedicineForm;
    conditionReason?: string;
    frequencyType: FrequencyType;
    intakeTimes: string[];
    frequencyConfig?: FrequencyConfig;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration?: number;
    refillReminderThreshold?: number;
    foodInstruction?: FoodInstruction;
    icon?: string;
    color?: string;
    isActive: boolean;
    relatedAllergies: AllergyResponse[];
    formattedDosage?: string;
}

export interface IntakeSchedule {
    time: string; // HH:mm format
    amount: number;
}

export interface FrequencyConfig {
    intervalDays?: number;
    specificDays?: DayOfWeek[];
    cycleActiveDays?: number;
    cycleRestDays?: number;
    dayOfMonth?: number;
}

export interface AllergyResponse {
    id: string;
    name: string;
    description?: string;
}

// Enums
export enum MedicineForm {
    PILL = 'PILL',
    CAPSULE = 'CAPSULE',
    TABLET = 'TABLET',
    INJECTION = 'INJECTION',
    LIQUID = 'LIQUID',
    DROPS = 'DROPS',
    INHALER = 'INHALER',
    POWDER = 'POWDER',
    PATCH = 'PATCH',
    GEL = 'GEL',
    SPRAY = 'SPRAY',
    OTHER = 'OTHER'
}

export enum FrequencyType {
    DAILY = 'DAILY',
    EVERY_OTHER_DAY = 'EVERY_OTHER_DAY',
    SPECIFIC_DAYS_OF_WEEK = 'SPECIFIC_DAYS_OF_WEEK',
    EVERY_X_DAYS = 'EVERY_X_DAYS',
    EVERY_X_WEEKS = 'EVERY_X_WEEKS',
    EVERY_X_MONTHS = 'EVERY_X_MONTHS',
    CYCLE_BASED = 'CYCLE_BASED'
}

export enum FoodInstruction {
    BEFORE_EATING = 'BEFORE_EATING',
    WHILE_EATING = 'WHILE_EATING',
    AFTER_EATING = 'AFTER_EATING',
    DOES_NOT_MATTER = 'DOES_NOT_MATTER',
    EMPTY_STOMACH = 'EMPTY_STOMACH'
}

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY'
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

// Medicine CRUD API Service Class
class MedicineApiService {
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

    // Create Medicine - POST /api/users/{userId}/medicines
    async createMedicine(userId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines`, {
            method: 'POST',
            body: JSON.stringify(medicineData),
        });
    }

    // Get All Medicines - GET /api/users/{userId}/medicines
    async getAllMedicines(userId: string): Promise<MedicineResponse[]> {
        return this.makeRequest<MedicineResponse[]>(`/api/users/${userId}/medicines`, {
            method: 'GET',
        });
    }

    // Get Medicine by ID - GET /api/users/{userId}/medicines/{medicineId}
    async getMedicineById(userId: string, medicineId: string): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'GET',
        });
    }

    // Update Medicine - PUT /api/users/{userId}/medicines/{medicineId}
    async updateMedicine(userId: string, medicineId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'PUT',
            body: JSON.stringify(medicineData),
        });
    }

    // Delete Medicine - DELETE /api/users/{userId}/medicines/{medicineId}
    async deleteMedicine(userId: string, medicineId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'DELETE',
        });
    }
}

// Medicine Storage Service for offline caching
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

// High-level Medicine Service with caching and offline support
export class MedicineService {
    private apiService: MedicineApiService;

    constructor() {
        this.apiService = new MedicineApiService();
    }

    // Get all medicines with caching
    async getMedicines(userId: string, useCache: boolean = true): Promise<MedicineResponse[]> {
        try {
            const medicines = await this.apiService.getAllMedicines(userId);
            await MedicineStorageService.storeMedicines(userId, medicines);
            return medicines;
        } catch (error) {
            if (useCache) {
                console.log('Using cached medicines due to network error');
                return await MedicineStorageService.getStoredMedicines(userId);
            }
            throw error;
        }
    }

    // Get single medicine by ID
    async getMedicineById(userId: string, medicineId: string): Promise<MedicineResponse> {
        return this.apiService.getMedicineById(userId, medicineId);
    }

    // Create new medicine
    async createMedicine(userId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        const medicine = await this.apiService.createMedicine(userId, medicineData);

        // Update cache with new medicine
        const cachedMedicines = await MedicineStorageService.getStoredMedicines(userId);
        cachedMedicines.push(medicine);
        await MedicineStorageService.storeMedicines(userId, cachedMedicines);

        return medicine;
    }

    // Update existing medicine
    async updateMedicine(userId: string, medicineId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        const updatedMedicine = await this.apiService.updateMedicine(userId, medicineId, medicineData);

        // Update cache
        const cachedMedicines = await MedicineStorageService.getStoredMedicines(userId);
        const index = cachedMedicines.findIndex(m => m.id === medicineId);
        if (index !== -1) {
            cachedMedicines[index] = updatedMedicine;
            await MedicineStorageService.storeMedicines(userId, cachedMedicines);
        }

        return updatedMedicine;
    }

    // Delete medicine
    async deleteMedicine(userId: string, medicineId: string): Promise<void> {
        await this.apiService.deleteMedicine(userId, medicineId);

        // Remove from cache
        const cachedMedicines = await MedicineStorageService.getStoredMedicines(userId);
        const filteredMedicines = cachedMedicines.filter(m => m.id !== medicineId);
        await MedicineStorageService.storeMedicines(userId, filteredMedicines);
    }

    // Refresh medicines from server
    async refreshMedicines(userId: string): Promise<MedicineResponse[]> {
        return this.getMedicines(userId, false);
    }

    // Clear cache
    async clearCache(userId: string): Promise<void> {
        await MedicineStorageService.clearMedicineCache(userId);
    }

    // Get cached medicines only
    async getCachedMedicines(userId: string): Promise<MedicineResponse[]> {
        return MedicineStorageService.getStoredMedicines(userId);
    }

    // Check if cache exists
    async hasCachedData(userId: string): Promise<boolean> {
        const medicines = await MedicineStorageService.getStoredMedicines(userId);
        return medicines.length > 0;
    }

    // Get last sync time
    async getLastSyncTime(): Promise<Date | null> {
        return MedicineStorageService.getLastSync();
    }
}

// Export singleton instance
export const medicineService = new MedicineService();
export const medicineApiService = new MedicineApiService();