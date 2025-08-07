// medicineStatsApi.ts - Medicine Statistics Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// Type Definitions matching your MedicineStatsController
export interface DailyMedicineSchedule {
    date: string; // YYYY-MM-DD format
    intakeEvents: IntakeEvent[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    totalPending: number;
}

export interface IntakeEvent {
    id: string;
    medicineId: string;
    medicineName: string;
    medicineIcon?: string;
    medicineColor?: string;
    scheduledDateTime: string;
    actualDateTime?: string;
    status: IntakeStatus;
    scheduledAmount: number;
    actualAmount?: number;
    note?: string;
    skipReason?: string;
    canTakeLate?: boolean;
    inventoryAvailable?: boolean;
    formattedDosage?: string;
}

export interface WeeklyStats {
    weekStartDate: string;
    weekEndDate: string;
    dailySchedules: DailyMedicineSchedule[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    adherenceRate: number;
    bestDay: string;
    worstDay: string;
}

export interface AdherenceStats {
    period: 'today' | 'week' | 'month';
    adherenceRate: number;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
    onTimeRate: number;
    lateRate: number;
}

// Enums
export enum IntakeStatus {
    SCHEDULED = 'SCHEDULED',
    TAKEN = 'TAKEN',
    MISSED = 'MISSED',
    SKIPPED = 'SKIPPED'
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

// Medicine Stats API Service Class
class MedicineStatsApiService {
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

    // Get Today Stats - GET /api/users/{userId}/medicines/stats/today
    async getTodayStats(userId: string): Promise<DailyMedicineSchedule> {
        return this.makeRequest<DailyMedicineSchedule>(`/api/users/${userId}/medicines/stats/today`, {
            method: 'GET',
        });
    }

    // Get This Week Stats - GET /api/users/{userId}/medicines/stats/this-week
    async getThisWeekStats(userId: string): Promise<DailyMedicineSchedule[]> {
        return this.makeRequest<DailyMedicineSchedule[]>(`/api/users/${userId}/medicines/stats/this-week`, {
            method: 'GET',
        });
    }
}

// Medicine Stats Storage Service for offline caching
export class MedicineStatsStorageService {
    private static readonly KEYS = {
        TODAY_STATS: 'today_stats',
        WEEK_STATS: 'week_stats',
        ADHERENCE_STATS: 'adherence_stats',
        LAST_SYNC: 'stats_last_sync',
    } as const;

    // Today stats caching
    static async storeTodayStats(userId: string, stats: DailyMedicineSchedule): Promise<void> {
        const key = `${this.KEYS.TODAY_STATS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
        await this.updateLastSync();
    }

    static async getStoredTodayStats(userId: string): Promise<DailyMedicineSchedule | null> {
        try {
            const key = `${this.KEYS.TODAY_STATS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Week stats caching
    static async storeWeekStats(userId: string, stats: DailyMedicineSchedule[]): Promise<void> {
        const key = `${this.KEYS.WEEK_STATS}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
    }

    static async getStoredWeekStats(userId: string): Promise<DailyMedicineSchedule[]> {
        try {
            const key = `${this.KEYS.WEEK_STATS}_${userId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Adherence stats caching
    static async storeAdherenceStats(userId: string, period: string, stats: AdherenceStats): Promise<void> {
        const key = `${this.KEYS.ADHERENCE_STATS}_${userId}_${period}`;
        await AsyncStorage.setItem(key, JSON.stringify(stats));
    }

    static async getStoredAdherenceStats(userId: string, period: string): Promise<AdherenceStats | null> {
        try {
            const key = `${this.KEYS.ADHERENCE_STATS}_${userId}_${period}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Sync management
    static async updateLastSync(): Promise<void> {
        await AsyncStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    }

    static async getLastSync(): Promise<Date | null> {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.LAST_SYNC);
            return data ? new Date(data) : null;
        } catch {
            return null;
        }
    }

    // Clear stats cache for user
    static async clearStatsCache(userId: string): Promise<void> {
        const allKeys = await AsyncStorage.getAllKeys();
        const userStatsKeys = allKeys.filter(key =>
                key.includes(`_${userId}`) && (
                    key.includes(this.KEYS.TODAY_STATS) ||
                    key.includes(this.KEYS.WEEK_STATS) ||
                    key.includes(this.KEYS.ADHERENCE_STATS)
                )
        );

        await AsyncStorage.multiRemove(userStatsKeys);
    }
}

// High-level Medicine Stats Service with caching and analytics
export class MedicineStatsService {
    private apiService: MedicineStatsApiService;

    constructor() {
        this.apiService = new MedicineStatsApiService();
    }

    // Basic Stats Operations with caching
    async getTodayStats(userId: string, useCache: boolean = true): Promise<DailyMedicineSchedule> {
        try {
            const stats = await this.apiService.getTodayStats(userId);
            await MedicineStatsStorageService.storeTodayStats(userId, stats);
            return stats;
        } catch (error) {
            if (useCache) {
                console.log('Using cached today stats due to network error');
                const cached = await MedicineStatsStorageService.getStoredTodayStats(userId);
                if (cached) return cached;
            }
            throw error;
        }
    }

    async getThisWeekStats(userId: string, useCache: boolean = true): Promise<DailyMedicineSchedule[]> {
        try {
            const stats = await this.apiService.getThisWeekStats(userId);
            await MedicineStatsStorageService.storeWeekStats(userId, stats);
            return stats;
        } catch (error) {
            if (useCache) {
                console.log('Using cached week stats due to network error');
                return await MedicineStatsStorageService.getStoredWeekStats(userId);
            }
            throw error;
        }
    }

    // Enhanced Analytics Methods
    async getTodayAdherenceRate(userId: string, useCache: boolean = true): Promise<number> {
        const todayStats = await this.getTodayStats(userId, useCache);
        if (todayStats.totalScheduled === 0) return 0;
        return Math.round((todayStats.totalTaken / todayStats.totalScheduled) * 100);
    }

    async getWeeklyAdherenceRate(userId: string, useCache: boolean = true): Promise<number> {
        const weekStats = await this.getThisWeekStats(userId, useCache);

        const totals = weekStats.reduce((acc, day) => ({
            scheduled: acc.scheduled + day.totalScheduled,
            taken: acc.taken + day.totalTaken
        }), { scheduled: 0, taken: 0 });

        if (totals.scheduled === 0) return 0;
        return Math.round((totals.taken / totals.scheduled) * 100);
    }

    async getWeeklyStatsWithAnalytics(userId: string, useCache: boolean = true): Promise<WeeklyStats> {
        const weekStats = await this.getThisWeekStats(userId, useCache);

        if (weekStats.length === 0) {
            return {
                weekStartDate: '',
                weekEndDate: '',
                dailySchedules: [],
                totalScheduled: 0,
                totalTaken: 0,
                totalSkipped: 0,
                totalMissed: 0,
                adherenceRate: 0,
                bestDay: '',
                worstDay: ''
            };
        }

        // Calculate totals
        const totals = weekStats.reduce((acc, day) => ({
            scheduled: acc.scheduled + day.totalScheduled,
            taken: acc.taken + day.totalTaken,
            skipped: acc.skipped + day.totalSkipped,
            missed: acc.missed + day.totalMissed
        }), { scheduled: 0, taken: 0, skipped: 0, missed: 0 });

        // Find best and worst days
        const daysWithRates = weekStats.map(day => ({
            date: day.date,
            rate: day.totalScheduled > 0 ? (day.totalTaken / day.totalScheduled) * 100 : 0
        }));

        const bestDay = daysWithRates.reduce((best, current) =>
            current.rate > best.rate ? current : best
        );

        const worstDay = daysWithRates.reduce((worst, current) =>
            current.rate < worst.rate ? current : worst
        );

        return {
            weekStartDate: weekStats[0]?.date || '',
            weekEndDate: weekStats[weekStats.length - 1]?.date || '',
            dailySchedules: weekStats,
            totalScheduled: totals.scheduled,
            totalTaken: totals.taken,
            totalSkipped: totals.skipped,
            totalMissed: totals.missed,
            adherenceRate: totals.scheduled > 0 ? Math.round((totals.taken / totals.scheduled) * 100) : 0,
            bestDay: bestDay.date,
            worstDay: worstDay.date
        };
    }

    async getAdherenceStats(userId: string, period: 'today' | 'week' = 'today', useCache: boolean = true): Promise<AdherenceStats> {
        const cacheKey = `${period}`;

        if (useCache) {
            const cached = await MedicineStatsStorageService.getStoredAdherenceStats(userId, cacheKey);
            if (cached) return cached;
        }

        let stats: AdherenceStats;

        if (period === 'today') {
            const todayStats = await this.getTodayStats(userId, useCache);

            // Calculate on-time vs late rates
            const takenEvents = todayStats.intakeEvents.filter(event => event.status === IntakeStatus.TAKEN);
            const onTimeEvents = takenEvents.filter(event => {
                if (!event.actualDateTime) return false;
                const scheduled = new Date(event.scheduledDateTime);
                const actual = new Date(event.actualDateTime);
                return actual <= scheduled;
            });

            stats = {
                period: 'today',
                adherenceRate: todayStats.totalScheduled > 0 ?
                    Math.round((todayStats.totalTaken / todayStats.totalScheduled) * 100) : 0,
                totalDoses: todayStats.totalScheduled,
                takenDoses: todayStats.totalTaken,
                missedDoses: todayStats.totalMissed,
                skippedDoses: todayStats.totalSkipped,
                onTimeRate: takenEvents.length > 0 ?
                    Math.round((onTimeEvents.length / takenEvents.length) * 100) : 0,
                lateRate: takenEvents.length > 0 ?
                    Math.round(((takenEvents.length - onTimeEvents.length) / takenEvents.length) * 100) : 0
            };
        } else {
            const weekStats = await this.getThisWeekStats(userId, useCache);
            const totals = weekStats.reduce((acc, day) => ({
                scheduled: acc.scheduled + day.totalScheduled,
                taken: acc.taken + day.totalTaken,
                missed: acc.missed + day.totalMissed,
                skipped: acc.skipped + day.totalSkipped
            }), { scheduled: 0, taken: 0, missed: 0, skipped: 0 });

            // Calculate on-time vs late for the week
            const allTakenEvents = weekStats.flatMap(day =>
                day.intakeEvents.filter(event => event.status === IntakeStatus.TAKEN)
            );

            const onTimeEvents = allTakenEvents.filter(event => {
                if (!event.actualDateTime) return false;
                const scheduled = new Date(event.scheduledDateTime);
                const actual = new Date(event.actualDateTime);
                return actual <= scheduled;
            });

            stats = {
                period: 'week',
                adherenceRate: totals.scheduled > 0 ?
                    Math.round((totals.taken / totals.scheduled) * 100) : 0,
                totalDoses: totals.scheduled,
                takenDoses: totals.taken,
                missedDoses: totals.missed,
                skippedDoses: totals.skipped,
                onTimeRate: allTakenEvents.length > 0 ?
                    Math.round((onTimeEvents.length / allTakenEvents.length) * 100) : 0,
                lateRate: allTakenEvents.length > 0 ?
                    Math.round(((allTakenEvents.length - onTimeEvents.length) / allTakenEvents.length) * 100) : 0
            };
        }

        // Cache the calculated stats
        await MedicineStatsStorageService.storeAdherenceStats(userId, cacheKey, stats);
        return stats;
    }

    // Utility Methods
    async refreshAllStats(userId: string): Promise<void> {
        try {
            await Promise.all([
                this.getTodayStats(userId, false),
                this.getThisWeekStats(userId, false)
            ]);
        } catch (error) {
            console.error('Error refreshing stats data:', error);
            throw error;
        }
    }

    async clearCache(userId: string): Promise<void> {
        await MedicineStatsStorageService.clearStatsCache(userId);
    }

    async getLastSyncTime(): Promise<Date | null> {
        return MedicineStatsStorageService.getLastSync();
    }

    // Get cached data only
    async getCachedTodayStats(userId: string): Promise<DailyMedicineSchedule | null> {
        return MedicineStatsStorageService.getStoredTodayStats(userId);
    }

    async getCachedWeekStats(userId: string): Promise<DailyMedicineSchedule[]> {
        return MedicineStatsStorageService.getStoredWeekStats(userId);
    }

    // Quick stats getters for UI components
    async getTodayProgressPercentage(userId: string, useCache: boolean = true): Promise<number> {
        const todayStats = await this.getTodayStats(userId, useCache);
        if (todayStats.totalScheduled === 0) return 0;

        const completed = todayStats.totalTaken + todayStats.totalSkipped;
        return Math.round((completed / todayStats.totalScheduled) * 100);
    }

    async getTodayRemainingCount(userId: string, useCache: boolean = true): Promise<number> {
        const todayStats = await this.getTodayStats(userId, useCache);
        return todayStats.totalPending;
    }

    async getWeeklyTrend(userId: string, useCache: boolean = true): Promise<'improving' | 'declining' | 'stable'> {
        const weekStats = await this.getThisWeekStats(userId, useCache);

        if (weekStats.length < 2) return 'stable';

        // Compare first half vs second half of the week
        const firstHalf = weekStats.slice(0, Math.floor(weekStats.length / 2));
        const secondHalf = weekStats.slice(Math.floor(weekStats.length / 2));

        const firstHalfRate = this.calculateAverageAdherence(firstHalf);
        const secondHalfRate = this.calculateAverageAdherence(secondHalf);

        const difference = secondHalfRate - firstHalfRate;

        if (difference > 5) return 'improving';
        if (difference < -5) return 'declining';
        return 'stable';
    }

    private calculateAverageAdherence(days: DailyMedicineSchedule[]): number {
        const totals = days.reduce((acc, day) => ({
            scheduled: acc.scheduled + day.totalScheduled,
            taken: acc.taken + day.totalTaken
        }), { scheduled: 0, taken: 0 });

        return totals.scheduled > 0 ? (totals.taken / totals.scheduled) * 100 : 0;
    }
}

// Export singleton instance
export const medicineStatsService = new MedicineStatsService();
export const medicineStatsApiService = new MedicineStatsApiService();