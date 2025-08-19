import { AllergyRequest, AllergyResponse } from './AllergyTypes';
import { AllergyApiService } from './AllergyApiService';
import { AllergyStorageService } from './AllergyStorageService';

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
                return await AllergyStorageService.getStoredAllergies(userId);
            }
            throw error;
        }
    }

    async createAllergy(userId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
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
}

// Export singleton instance
export const allergyService = new AllergyService();