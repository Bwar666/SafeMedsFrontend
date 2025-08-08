// AiWarningApiService.ts
import { AiWarningResponse, ApiError } from './AiWarningTypes';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.5';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8080`
    : 'https://your-production-api.com';

// API Response Handler
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

// AI Warning API Service Class
export class AiWarningApiService {
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

    // Get User Warnings - GET /api/ai/warnings/user/{userId}
    async getUserWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}`, {
            method: 'GET',
        });
    }

    // Get Unseen Warnings - GET /api/ai/warnings/user/{userId}/unseen
    async getUnseenWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/unseen`, {
            method: 'GET',
        });
    }

    // Get Urgent Warnings - GET /api/ai/warnings/user/{userId}/urgent
    async getUrgentWarnings(userId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/urgent`, {
            method: 'GET',
        });
    }

    // Get Warnings for Medicine - GET /api/ai/warnings/user/{userId}/medicine/{medicineId}
    async getWarningsForMedicine(userId: string, medicineId: string): Promise<AiWarningResponse[]> {
        return this.makeRequest<AiWarningResponse[]>(`/api/ai/warnings/user/${userId}/medicine/${medicineId}`, {
            method: 'GET',
        });
    }

    // Mark as Seen - PUT /api/ai/warnings/{warningId}/seen
    async markAsSeen(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}/seen?userId=${userId}`, {
            method: 'PUT',
        });
    }

    // Mark as Resolved - PUT /api/ai/warnings/{warningId}/resolved
    async markAsResolved(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}/resolved?userId=${userId}`, {
            method: 'PUT',
        });
    }

    // Delete Warning - DELETE /api/ai/warnings/{warningId}
    async deleteWarning(warningId: string, userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/ai/warnings/${warningId}?userId=${userId}`, {
            method: 'DELETE',
        });
    }
}