// medicineService.ts - High-level Medicine Service with caching
import { MedicineApiService } from './MedicineApiService';
import { MedicineStorageService } from './MedicineSrorageService';
import { MedicineRequest, MedicineResponse } from './MedicineServiceTypes';
import {MedicineNotificationService} from "@/app/services/background/MedicineNotificationService";

// High-level Medicine Service with caching and offline support
export class MedicineService {
    private apiService: MedicineApiService;

    constructor(apiService: MedicineApiService = new MedicineApiService()) {
        this.apiService = apiService;
    }

    // Get all medicines with caching
    async getMedicines(userId: string, useCache: boolean = true): Promise<MedicineResponse[]> {
        try {
            const medicines = await this.apiService.getAllMedicines(userId);
            await MedicineStorageService.storeMedicines(userId, medicines);
            return medicines;
        } catch (error) {
            if (useCache) {
                return await MedicineStorageService.getStoredMedicines(userId);
            }
            throw error;
        }
    }

    async getMedicineById(userId: string, medicineId: string): Promise<MedicineResponse> {

        try {
            const medicine = await this.apiService.getMedicineById(userId, medicineId);
            return medicine;
        } catch (error) {
            const cachedMedicine = await MedicineStorageService.getMedicineById(userId, medicineId);
            if (cachedMedicine) {
                return cachedMedicine;
            } else {
                throw new Error(`Medicine with ID ${medicineId} not found`);
            }
        }
    }

    // Create new medicine
    async createMedicine(userId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        const medicine = await this.apiService.createMedicine(userId, medicineData);
        await MedicineNotificationService.refreshNotifications(userId);
        // Update cache with new medicine
        const cachedMedicines = await MedicineStorageService.getStoredMedicines(userId);
        cachedMedicines.push(medicine);
        await MedicineStorageService.storeMedicines(userId, cachedMedicines);

        return medicine;
    }

    // Update existing medicine
    async updateMedicine(userId: string, medicineId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        const updatedMedicine = await this.apiService.updateMedicine(userId, medicineId, medicineData);
        await MedicineNotificationService.scheduleUpcomingReminders(userId);
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
        await MedicineNotificationService.refreshNotifications(userId);
        const cachedMedicines = await MedicineStorageService.getStoredMedicines(userId);
        const filteredMedicines = cachedMedicines.filter(m => m.id !== medicineId);
        await MedicineStorageService.storeMedicines(userId, filteredMedicines);
    }
}

// Export singleton instance
export const medicineService = new MedicineService();