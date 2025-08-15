// medicalSearchApiService.ts
import { SearchResponse, ApiError, SearchCategory } from './MedicalSearchTypes';

// Configuration (using same as userApi.ts)
const COMPUTER_IP = '192.168.1.4';
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

// Medical Search API Service Class
export class MedicalSearchApiService {
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