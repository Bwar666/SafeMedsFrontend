import {
    TakeMedicineRequest,
    SkipMedicineRequest,
    MedicineUsageResponse,
    DailyMedicineSchedule,
    IntakeEvent,
    InventoryUpdateRequest,
    MedicineResponse,
    IntakeStatus
} from './MedicineUsageTypes';
import { MedicineUsageApiService } from './MedicineUsageApiService';
import { MedicineUsageStorageService } from './MedicineUsageStorageService';
import AsyncStorage from "@react-native-async-storage/async-storage";

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

        await this.invalidateScheduleCache(userId);

        return response;
    }

    async pauseMedicine(userId: string, medicineId: string): Promise<void> {
        await this.apiService.pauseMedicine(userId, medicineId);
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

    // Inventory Operations
    async updateInventory(userId: string, medicineId: string, request: InventoryUpdateRequest): Promise<void> {
        await this.apiService.updateInventory(userId, medicineId, request);

        // Clear low inventory cache to refresh
        const key = `low_inventory_medicines_${userId}`;
        await AsyncStorage.removeItem(key);
    }


    async markEventAsMissed(userId: string, intakeEventId: string, automatic: boolean = false): Promise<void> {
        await this.apiService.markEventAsMissed(userId, intakeEventId, automatic);
        await this.invalidateScheduleCache(userId);
    }

    async getCachedTodaySchedule(userId: string): Promise<DailyMedicineSchedule | null> {
        const today = new Date().toISOString().split('T')[0];
        return MedicineUsageStorageService.getStoredDailySchedule(userId, today);
    }

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

    validateTakeMedicineRequest(request: TakeMedicineRequest): { isValid: boolean; error?: string } {
        if (!request.intakeEventId) {
            return { isValid: false, error: 'Intake event ID is required please update your inventory.' };
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

        if (request.deductFromInventory && request.currentInventory <request.actualDosageAmount) {
            return { isValid: false, error: "Not enough medication in inventory" };
        }
        return { isValid: true };
    }

    validateSkipMedicineRequest(request: SkipMedicineRequest): { isValid: boolean; error?: string } {
        if (!request.intakeEventId) {
            return { isValid: false, error: 'Intake event ID is required' };
        }

        if (!request.skipReason || request.skipReason.trim().length === 0) {
            return { isValid: false, error: 'Skip reason is required' };
        }

        return { isValid: true };
    }
}

// Export singleton instances
export const medicineUsageService = new MedicineUsageService();
export const medicineUsageApiService = new MedicineUsageApiService();