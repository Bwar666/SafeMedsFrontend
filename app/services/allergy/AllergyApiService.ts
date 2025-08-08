// AllergyApiService.ts
import { AllergyRequest, AllergyResponse, ApiError } from './AllergyTypes';

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

// Allergy API Service Class
export class AllergyApiService {
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

    // Create Allergy - POST /api/users/{userId}/allergies/create
    async createAllergy(userId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/create`, {
            method: 'POST',
            body: JSON.stringify(allergyData),
        });
    }

    // Get Allergy by ID - GET /api/users/{userId}/allergies/{allergyId}
    async getAllergyById(userId: string, allergyId: string): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/${allergyId}`, {
            method: 'GET',
        });
    }

    // Get All Allergies - GET /api/users/{userId}/allergies/all
    async getAllAllergies(userId: string): Promise<AllergyResponse[]> {
        return this.makeRequest<AllergyResponse[]>(`/api/users/${userId}/allergies/all`, {
            method: 'GET',
        });
    }

    // Update Allergy - PUT /api/users/{userId}/allergies/update/{allergyId}
    async updateAllergy(userId: string, allergyId: string, allergyData: AllergyRequest): Promise<AllergyResponse> {
        return this.makeRequest<AllergyResponse>(`/api/users/${userId}/allergies/update/${allergyId}`, {
            method: 'PUT',
            body: JSON.stringify(allergyData),
        });
    }

    // Delete Allergy - DELETE /api/users/{userId}/allergies/delete/{allergyId}
    async deleteAllergy(userId: string, allergyId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/allergies/delete/${allergyId}`, {
            method: 'DELETE',
        });
    }
}