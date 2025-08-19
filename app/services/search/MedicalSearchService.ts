// medicalSearchService.ts
import {
    SearchCategory,
    SearchSuggestion,
    SearchResponse,
    ApiError
} from './MedicalSearchTypes';
import { MedicalSearchApiService } from './MedicalSearchApiService';
import { MedicalSearchStorageService } from './MedicalSearchStorageService';

// High-level Medical Search Service with caching and offline support
export class MedicalSearchService {
    private apiService: MedicalSearchApiService;
    private searchTimeouts: Map<string, number> = new Map();

    constructor() {
        this.apiService = new MedicalSearchApiService();
    }

    // Medicine search with caching
    async searchMedicines(query: string, limit: number = 10, useCache: boolean = true): Promise<SearchResponse> {
        const validation = this.validateSearchQuery(query);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Check cache first if enabled
        if (useCache) {
            const cached = await MedicalSearchStorageService.getCachedSearchResults(SearchCategory.MEDICINES, query);
            if (cached) {
                return cached;
            }
        }

        try {
            const results = await this.apiService.searchMedicines(query, limit);

            // Cache results and add to search tracking
            await Promise.all([
                MedicalSearchStorageService.cacheSearchResults(SearchCategory.MEDICINES, query, results),
                MedicalSearchStorageService.addRecentSearch(SearchCategory.MEDICINES, query),
                MedicalSearchStorageService.addToSearchHistory(SearchCategory.MEDICINES, query, results.suggestions.length)
            ]);

            return results;
        } catch (error) {
            // Fallback to recent searches if network fails
            if (useCache) {
                return this.getFallbackResults(SearchCategory.MEDICINES, query);
            }
            throw error;
        }
    }

    // Condition search with caching
    async searchConditions(query: string, limit: number = 10, useCache: boolean = true): Promise<SearchResponse> {
        const validation = this.validateSearchQuery(query);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        if (useCache) {
            const cached = await MedicalSearchStorageService.getCachedSearchResults(SearchCategory.CONDITIONS, query);
            if (cached) {
                return cached;
            }
        }

        try {
            const results = await this.apiService.searchConditions(query, limit);

            await Promise.all([
                MedicalSearchStorageService.cacheSearchResults(SearchCategory.CONDITIONS, query, results),
                MedicalSearchStorageService.addRecentSearch(SearchCategory.CONDITIONS, query),
                MedicalSearchStorageService.addToSearchHistory(SearchCategory.CONDITIONS, query, results.suggestions.length)
            ]);

            return results;
        } catch (error) {
            if (useCache) {
                return this.getFallbackResults(SearchCategory.CONDITIONS, query);
            }
            throw error;
        }
    }

    // Allergy search with caching
    async searchAllergies(query: string, limit: number = 10, useCache: boolean = true): Promise<SearchResponse> {
        const validation = this.validateSearchQuery(query);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        if (useCache) {
            const cached = await MedicalSearchStorageService.getCachedSearchResults(SearchCategory.ALLERGIES, query);
            if (cached) {
                return cached;
            }
        }

        try {
            const results = await this.apiService.searchAllergies(query, limit);

            await Promise.all([
                MedicalSearchStorageService.cacheSearchResults(SearchCategory.ALLERGIES, query, results),
                MedicalSearchStorageService.addRecentSearch(SearchCategory.ALLERGIES, query),
                MedicalSearchStorageService.addToSearchHistory(SearchCategory.ALLERGIES, query, results.suggestions.length)
            ]);

            return results;
        } catch (error) {
            if (useCache) {
                return this.getFallbackResults(SearchCategory.ALLERGIES, query);
            }
            throw error;
        }
    }

    async search(category: SearchCategory, query: string, limit: number = 10, useCache: boolean = true): Promise<SearchResponse> {
        switch (category) {
            case SearchCategory.MEDICINES:
                return this.searchMedicines(query, limit, useCache);
            case SearchCategory.CONDITIONS:
                return this.searchConditions(query, limit, useCache);
            case SearchCategory.ALLERGIES:
                return this.searchAllergies(query, limit, useCache);
            default:
                throw new Error(`Unsupported search category: ${category}`);
        }
    }
    async getSearchSuggestions(category: SearchCategory, query: string = ''): Promise<SearchSuggestion[]> {
        if (query.length >= 2) {
            try {
                const results = await this.search(category, query);
                return results.suggestions;
            } catch (error) {
                console.log('Failed to get search results, falling back to recent searches');
            }
        }

        // Fallback to recent searches and popular suggestions
        const [recentSearches, popularSuggestions] = await Promise.all([
            this.getRecentSearches(category),
            this.getPopularSuggestions(category)
        ]);

        const suggestions: SearchSuggestion[] = [];

        // Add recent searches as suggestions
        recentSearches.forEach(recent => {
            if (!query || recent.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    value: recent,
                    displayName: recent,
                    description: 'Recent search',
                    source: 'recent',
                    category: category
                });
            }
        });

        // Add popular suggestions
        popularSuggestions.forEach(popular => {
            if (!query || popular.displayName.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push(popular);
            }
        });

        const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
            index === self.findIndex(s => s.value === suggestion.value)
        );

        return uniqueSuggestions.slice(0, 10);
    }

    async getRecentSearches(category: SearchCategory): Promise<string[]> {
        return MedicalSearchStorageService.getRecentSearches(category);
    }

    async getPopularSuggestions(category: SearchCategory): Promise<SearchSuggestion[]> {
        return MedicalSearchStorageService.getPopularSuggestions(category);
    }

    async getSearchHistory(): Promise<Array<{
        category: SearchCategory;
        query: string;
        resultCount: number;
        timestamp: string;
    }>> {
        return MedicalSearchStorageService.getSearchHistory();
    }


    // Validate search query
    validateSearchQuery(query: string): { isValid: boolean; error?: string } {
        if (typeof query !== 'string') {
            return { isValid: false, error: 'Query must be a string' };
        }

        if (query.trim().length === 0) {
            return { isValid: false, error: 'Query cannot be empty' };
        }

        if (query.length < 2) {
            return { isValid: false, error: 'Query must be at least 2 characters long' };
        }

        if (query.length > 100) {
            return { isValid: false, error: 'Query is too long (max 100 characters)' };
        }

        return { isValid: true };
    }

    private async getFallbackResults(category: SearchCategory, query: string): Promise<SearchResponse> {
        const recentSearches = await this.getRecentSearches(category);
        const matchingRecent = recentSearches.filter(recent =>
            recent.toLowerCase().includes(query.toLowerCase())
        );

        return {
            suggestions: matchingRecent.map(recent => ({
                value: recent,
                displayName: recent,
                description: 'From recent searches',
                source: 'cache',
                category: category
            })),
            query,
            category: category,
            hasMore: false,
            source: 'cache'
        };
    }
}

// Export singleton instance
export const medicalSearchService = new MedicalSearchService();