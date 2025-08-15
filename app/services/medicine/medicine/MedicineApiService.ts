// medicineApiService.ts - Medicine API Service (pure API communication)
import {
    MedicineRequest,
    MedicineResponse,
    ApiError
} from './MedicineServiceTypes';

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

// Medicine CRUD API Service Class
export class MedicineApiService {
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

    // Create Medicine - POST /api/users/{userId}/medicines
    async createMedicine(userId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines`, {
            method: 'POST',
            body: JSON.stringify(medicineData),
        });
    }

    // Get All Medicines - GET /api/users/{userId}/medicines
    async getAllMedicines(userId: string): Promise<MedicineResponse[]> {
        return this.makeRequest<MedicineResponse[]>(`/api/users/${userId}/medicines`, {
            method: 'GET',
        });
    }

    // Get Medicine by ID - GET /api/users/{userId}/medicines/{medicineId}
    async getMedicineById(userId: string, medicineId: string): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'GET',
        });
    }

    // Update Medicine - PUT /api/users/{userId}/medicines/{medicineId}
    async updateMedicine(userId: string, medicineId: string, medicineData: MedicineRequest): Promise<MedicineResponse> {
        return this.makeRequest<MedicineResponse>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'PUT',
            body: JSON.stringify(medicineData),
        });
    }

    // Delete Medicine - DELETE /api/users/{userId}/medicines/{medicineId}
    async deleteMedicine(userId: string, medicineId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}`, {
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const medicineApiService = new MedicineApiService();