// medicineStatsService.ts
import {
    DailyMedicineSchedule,
    WeeklyStats,
    AdherenceStats,
    IntakeStatus
} from './MedicineStatsTypes';
import { MedicineStatsApiService } from './MedicineStatsApiService';
import { MedicineStatsStorageService } from './MedicineStatsStorageService';

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

// Export singleton instances
export const medicineStatsService = new MedicineStatsService();
export const medicineStatsApiService = new MedicineStatsApiService();