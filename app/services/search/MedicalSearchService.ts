// medicalSearchApi.ts - Medical Search Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your SearchController DTOs
export interface SearchSuggestion {
    value: string;
    displayName: string;
    description?: string;
    source: string;
    category: string;
    code?: string;
}

export interface SearchResponse {
    suggestions: SearchSuggestion[];
    query: string;
    category: string;
    hasMore: boolean;
    source: string;
}

export interface SearchFilters {
    limit?: number;
    minLength?: number;
}

// Search Categories
export enum SearchCategory {
    MEDICINES = 'medicines',
    CONDITIONS = 'conditions',
    ALLERGIES = 'allergies'
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

// Medical Search API Service Class
class MedicalSearchApiService {
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

    private buildQueryParams(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });

        return searchParams.toString();
    }

    // Search Medicines - GET /api/search/medicines
    async searchMedicines(query: string, limit: number = 10): Promise<SearchResponse> {
        const params = this.buildQueryParams({ query, limit: Math.min(limit, 20) });
        return this.makeRequest<SearchResponse>(`/api/search/medicines?${params}`, {
            method: 'GET',
        });
    }

    // Search Conditions - GET /api/search/conditions
    async searchConditions(query: string, limit: number = 10): Promise<SearchResponse> {
        const params = this.buildQueryParams({ query, limit: Math.min(limit, 20) });
        return this.makeRequest<SearchResponse>(`/api/search/conditions?${params}`, {
            method: 'GET',
        });
    }

    // Search Allergies - GET /api/search/allergies
    async searchAllergies(query: string, limit: number = 10): Promise<SearchResponse> {
        const params = this.buildQueryParams({ query, limit: Math.min(limit, 20) });
        return this.makeRequest<SearchResponse>(`/api/search/allergies?${params}`, {
            method: 'GET',
        });
    }
}

// Medical Search Storage Service for caching and recent searches
export class MedicalSearchStorageService {
    private static readonly KEYS = {
        RECENT_SEARCHES: 'recent_medical_searches',
        SEARCH_CACHE: 'medical_search_cache',
        POPULAR_SUGGESTIONS: 'popular_medical_suggestions',
        SEARCH_HISTORY: 'medical_search_history',
    } as const;

    private static readonly MAX_RECENT_SEARCHES = 10;
    private static readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    // Recent searches management
    static async addRecentSearch(category: SearchCategory, query: string): Promise<void> {
        try {
            const key = `${this.KEYS.RECENT_SEARCHES}_${category}`;
            const recent = await this.getRecentSearches(category);

            // Remove if already exists and add to front
            const filtered = recent.filter(item => item.toLowerCase() !== query.toLowerCase());
            const updated = [query, ...filtered].slice(0, this.MAX_RECENT_SEARCHES);

            await AsyncStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
            console.log('Failed to save recent search:', error);
        }
    }

    static async getRecentSearches(category: SearchCategory): Promise<string[]> {
        try {
            const key = `${this.KEYS.RECENT_SEARCHES}_${category}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    static async clearRecentSearches(category: SearchCategory): Promise<void> {
        const key = `${this.KEYS.RECENT_SEARCHES}_${category}`;
        await AsyncStorage.removeItem(key);
    }

    // Search results caching
    static async cacheSearchResults(category: SearchCategory, query: string, results: SearchResponse): Promise<void> {
        try {
            const cacheKey = `${category}_${query.toLowerCase()}`;
            const cacheEntry = {
                results,
                timestamp: Date.now(),
                category,
                query
            };

            const allCache = await this.getAllCachedResults();
            allCache[cacheKey] = cacheEntry;

            await AsyncStorage.setItem(this.KEYS.SEARCH_CACHE, JSON.stringify(allCache));
        } catch (error) {
            console.log('Failed to cache search results:', error);
        }
    }

    static async getCachedSearchResults(category: SearchCategory, query: string): Promise<SearchResponse | null> {
        try {
            const cacheKey = `${category}_${query.toLowerCase()}`;
            const allCache = await this.getAllCachedResults();
            const cacheEntry = allCache[cacheKey];

            if (!cacheEntry) return null;

            // Check if cache is still valid
            const now = Date.now();
            if (now - cacheEntry.timestamp > this.CACHE_DURATION_MS) {
                delete allCache[cacheKey];
                await AsyncStorage.setItem(this.KEYS.SEARCH_CACHE, JSON.stringify(allCache));
                return null;
            }

            return cacheEntry.results;
        } catch {
            return null;
        }
    }

    private static async getAllCachedResults(): Promise<Record<string, any>> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.SEARCH_CACHE);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    // Popular suggestions management
    static async storePopularSuggestions(category: SearchCategory, suggestions: SearchSuggestion[]): Promise<void> {
        try {
            const key = `${this.KEYS.POPULAR_SUGGESTIONS}_${category}`;
            await AsyncStorage.setItem(key, JSON.stringify(suggestions));
        } catch (error) {
            console.log('Failed to store popular suggestions:', error);
        }
    }

    static async getPopularSuggestions(category: SearchCategory): Promise<SearchSuggestion[]> {
        try {
            const key = `${this.KEYS.POPULAR_SUGGESTIONS}_${category}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Search history tracking
    static async addToSearchHistory(category: SearchCategory, query: string, resultCount: number): Promise<void> {
        try {
            const historyEntry = {
                category,
                query,
                resultCount,
                timestamp: new Date().toISOString()
            };

            const history = await this.getSearchHistory();
            const updatedHistory = [historyEntry, ...history].slice(0, 50); // Keep last 50 searches

            await AsyncStorage.setItem(this.KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.log('Failed to add to search history:', error);
        }
    }

    static async getSearchHistory(): Promise<Array<{
        category: SearchCategory;
        query: string;
        resultCount: number;
        timestamp: string;
    }>> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.SEARCH_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Clear all search data
    static async clearAllSearchData(): Promise<void> {
        const keys = Object.values(this.KEYS);
        await AsyncStorage.multiRemove(keys);
    }

    static async clearExpiredCache(): Promise<void> {
        try {
            const allCache = await this.getAllCachedResults();
            const now = Date.now();
            let hasExpired = false;

            Object.keys(allCache).forEach(key => {
                if (now - allCache[key].timestamp > this.CACHE_DURATION_MS) {
                    delete allCache[key];
                    hasExpired = true;
                }
            });

            if (hasExpired) {
                await AsyncStorage.setItem(this.KEYS.SEARCH_CACHE, JSON.stringify(allCache));
            }
        } catch (error) {
            console.log('Failed to clear expired cache:', error);
        }
    }
}

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

    // Generic search method
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

    // Debounced search for real-time search suggestions
    async debouncedSearch(
        category: SearchCategory,
        query: string,
        callback: (results: SearchResponse | null) => void,
        delay: number = 300
    ): Promise<void> {
        const key = `${category}_${query}`;

        // Clear existing timeout
        const existingTimeout = this.searchTimeouts.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(async () => {
            try {
                if (query.length >= 2) {
                    const results = await this.search(category, query);
                    callback(results);
                } else {
                    callback(null);
                }
            } catch (error) {
                console.log('Debounced search failed:', error);
                callback(null);
            } finally {
                this.searchTimeouts.delete(key);
            }
        }, delay);

        this.searchTimeouts.set(key, timeout);
    }

    // Get search suggestions with fallbacks
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

        // Remove duplicates and limit results
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
            index === self.findIndex(s => s.value === suggestion.value)
        );

        return uniqueSuggestions.slice(0, 10);
    }

    // Utility Methods
    async getRecentSearches(category: SearchCategory): Promise<string[]> {
        return MedicalSearchStorageService.getRecentSearches(category);
    }

    async getPopularSuggestions(category: SearchCategory): Promise<SearchSuggestion[]> {
        return MedicalSearchStorageService.getPopularSuggestions(category);
    }

    async clearRecentSearches(category: SearchCategory): Promise<void> {
        return MedicalSearchStorageService.clearRecentSearches(category);
    }

    async clearAllSearchData(): Promise<void> {
        return MedicalSearchStorageService.clearAllSearchData();
    }

    async clearExpiredCache(): Promise<void> {
        return MedicalSearchStorageService.clearExpiredCache();
    }

    async getSearchHistory(): Promise<Array<{
        category: SearchCategory;
        query: string;
        resultCount: number;
        timestamp: string;
    }>> {
        return MedicalSearchStorageService.getSearchHistory();
    }

    // Cancel all pending searches
    cancelPendingSearches(): void {
        this.searchTimeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.searchTimeouts.clear();
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

    // Get fallback results when network fails
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

    // Pre-populate popular suggestions (call during app initialization)
    async initializePopularSuggestions(): Promise<void> {
        const commonMedicines: SearchSuggestion[] = [
            { value: 'aspirin', displayName: 'Aspirin', description: 'Pain reliever and anti-inflammatory', source: 'default', category: SearchCategory.MEDICINES },
            { value: 'ibuprofen', displayName: 'Ibuprofen', description: 'Anti-inflammatory drug', source: 'default', category: SearchCategory.MEDICINES },
            { value: 'acetaminophen', displayName: 'Acetaminophen', description: 'Pain reliever and fever reducer', source: 'default', category: SearchCategory.MEDICINES },
            { value: 'lisinopril', displayName: 'Lisinopril', description: 'Blood pressure medication', source: 'default', category: SearchCategory.MEDICINES },
            { value: 'metformin', displayName: 'Metformin', description: 'Diabetes medication', source: 'default', category: SearchCategory.MEDICINES },
        ];

        const commonConditions: SearchSuggestion[] = [
            { value: 'hypertension', displayName: 'Hypertension', description: 'High blood pressure', source: 'default', category: SearchCategory.CONDITIONS },
            { value: 'diabetes', displayName: 'Diabetes', description: 'Blood sugar disorder', source: 'default', category: SearchCategory.CONDITIONS },
            { value: 'asthma', displayName: 'Asthma', description: 'Respiratory condition', source: 'default', category: SearchCategory.CONDITIONS },
            { value: 'arthritis', displayName: 'Arthritis', description: 'Joint inflammation', source: 'default', category: SearchCategory.CONDITIONS },
            { value: 'depression', displayName: 'Depression', description: 'Mental health condition', source: 'default', category: SearchCategory.CONDITIONS },
        ];

        const commonAllergies: SearchSuggestion[] = [
            { value: 'peanuts', displayName: 'Peanuts', description: 'Nut allergy', source: 'default', category: SearchCategory.ALLERGIES },
            { value: 'shellfish', displayName: 'Shellfish', description: 'Seafood allergy', source: 'default', category: SearchCategory.ALLERGIES },
            { value: 'penicillin', displayName: 'Penicillin', description: 'Antibiotic allergy', source: 'default', category: SearchCategory.ALLERGIES },
            { value: 'latex', displayName: 'Latex', description: 'Rubber allergy', source: 'default', category: SearchCategory.ALLERGIES },
            { value: 'pollen', displayName: 'Pollen', description: 'Seasonal allergy', source: 'default', category: SearchCategory.ALLERGIES },
        ];

        await Promise.all([
            MedicalSearchStorageService.storePopularSuggestions(SearchCategory.MEDICINES, commonMedicines),
            MedicalSearchStorageService.storePopularSuggestions(SearchCategory.CONDITIONS, commonConditions),
            MedicalSearchStorageService.storePopularSuggestions(SearchCategory.ALLERGIES, commonAllergies),
        ]);
    }

    // Get search analytics
    async getSearchAnalytics(): Promise<{
        totalSearches: number;
        searchesByCategory: { [key in SearchCategory]: number };
        topQueries: Array<{ query: string; count: number; category: SearchCategory }>;
        recentActivity: Array<{ category: SearchCategory; query: string; timestamp: string }>;
    }> {
        const history = await this.getSearchHistory();

        // Calculate total searches
        const totalSearches = history.length;

        // Group by category
        const searchesByCategory = history.reduce((acc, search) => {
            acc[search.category] = (acc[search.category] || 0) + 1;
            return acc;
        }, {} as { [key in SearchCategory]: number });

        // Get top queries
        const queryCount = history.reduce((acc, search) => {
            const key = `${search.category}_${search.query}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const topQueries = Object.entries(queryCount)
            .map(([key, count]) => {
                const [category, query] = key.split('_');
                return { query, count, category: category as SearchCategory };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Recent activity (last 10 searches)
        const recentActivity = history
            .slice(0, 10)
            .map(search => ({
                category: search.category,
                query: search.query,
                timestamp: search.timestamp
            }));

        return {
            totalSearches,
            searchesByCategory,
            topQueries,
            recentActivity
        };
    }

    // Check if search is trending (frequently searched recently)
    async isTrendingQuery(category: SearchCategory, query: string): Promise<boolean> {
        const history = await this.getSearchHistory();

        // Look at searches from last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSearches = history.filter(search =>
            search.category === category &&
            new Date(search.timestamp) > weekAgo
        );

        // Count occurrences of this query
        const queryCount = recentSearches.filter(search =>
            search.query.toLowerCase() === query.toLowerCase()
        ).length;

        // Consider trending if searched 3+ times in past week
        return queryCount >= 3;
    }

    // Format search suggestion for display
    formatSearchSuggestion(suggestion: SearchSuggestion): string {
        let formatted = suggestion.displayName;

        if (suggestion.description) {
            formatted += ` - ${suggestion.description}`;
        }

        if (suggestion.source === 'recent') {
            formatted += ' (Recent)';
        }

        return formatted;
    }
}

// Export singleton instance
export const medicalSearchService = new MedicalSearchService();