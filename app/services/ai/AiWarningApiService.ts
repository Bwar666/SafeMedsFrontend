import { AiWarningResponse, ApiError } from './AiWarningTypes';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.4';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8081`
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

    // Handle empty responses (204 No Content) or any response with no content
    if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
        return null as any;
    }

    // Check if response has content before trying to parse JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
        return null as any;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        // If JSON parsing fails, return null for successful responses
        return null as any;
    }
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