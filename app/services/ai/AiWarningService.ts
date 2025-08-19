import { AiWarningResponse, WarningSeverity } from './AiWarningTypes';
import { AiWarningApiService } from './AiWarningApiService';
import { AiWarningStorageService } from './AiWarningStorageService';

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

    // Delete warning with cache update
    async deleteWarning(warningId: string, userId: string): Promise<void> {
        await this.apiService.deleteWarning(warningId, userId);

        // Remove from all caches
        await this.removeWarningFromCache(userId, warningId);
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
        }
    }
}

// Export singleton instance
export const aiWarningService = new AiWarningService();