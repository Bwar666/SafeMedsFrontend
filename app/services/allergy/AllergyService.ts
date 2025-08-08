// allergyService.ts
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

    async getAllergyById(userId: string, allergyId: string): Promise<AllergyResponse> {
        return this.apiService.getAllergyById(userId, allergyId);
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