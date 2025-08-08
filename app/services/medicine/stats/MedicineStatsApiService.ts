// medicineStatsApiService.ts
import {
    DailyMedicineSchedule,
    ApiError
} from './MedicineStatsTypes';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

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
export class MedicineStatsApiService {
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