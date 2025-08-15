// medicineUsageService.ts
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

// Export singleton instances
export const medicineUsageService = new MedicineUsageService();
export const medicineUsageApiService = new MedicineUsageApiService();