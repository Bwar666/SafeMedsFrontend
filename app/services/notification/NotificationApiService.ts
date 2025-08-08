// notificationApiService.ts
import { ApiError, NotificationResult } from './notificationTypes';

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

    // Handle string responses from your controller
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        // Return the string response as message object
        return { message: text } as T;
    }
};

// Notification API Service Class
export class NotificationApiService {
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

    // Process Missed Doses - POST /api/notifications/process-missed
    async processMissedDoses(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/process-missed', {
            method: 'POST',
        });
    }

    // Check Upcoming Intakes - POST /api/notifications/check-upcoming
    async checkUpcomingIntakes(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/check-upcoming', {
            method: 'POST',
        });
    }

    // Check Low Inventory - POST /api/notifications/check-inventory
    async checkLowInventory(): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>('/api/notifications/check-inventory', {
            method: 'POST',
        });
    }

    // Process User Missed Doses - POST /api/notifications/users/{userId}/process-missed
    async processUserMissedDoses(userId: string): Promise<{ message: string }> {
        return this.makeRequest<{ message: string }>(`/api/notifications/users/${userId}/process-missed`, {
            method: 'POST',
        });
    }
}