// medicalSearchStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchCategory, SearchResponse, SearchSuggestion } from './MedicalSearchTypes';

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
}