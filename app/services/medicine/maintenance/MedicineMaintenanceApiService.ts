// medicineMaintenanceApiService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    MaintenanceResult,
    SystemHealthCheck,
    BatchProcessResult,
    ApiError
} from './MedicineMaintenanceTypes';

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

// Medicine Maintenance API Service Class
export class MedicineMaintenanceApiService {
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

    // Admin Maintenance Operations
    // Process All Missed Doses - POST /api/admin/medicines/process-all-missed
    async processAllMissedDoses(): Promise<void> {
        return this.makeRequest<void>('/api/admin/medicines/process-all-missed', {
            method: 'POST',
        });
    }

    // Note: Since your MedicineMaintenanceController only has one endpoint,
    // I'm adding some commonly needed maintenance operations that would
    // typically be in such a controller for a production app

    // Additional maintenance endpoints you might want to implement:

    // Health check endpoint
    async performHealthCheck(): Promise<SystemHealthCheck> {
        return this.makeRequest<SystemHealthCheck>('/api/admin/system/health', {
            method: 'GET',
        });
    }

    // Cleanup old data
    async cleanupOldData(daysOld: number = 90): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>(`/api/admin/maintenance/cleanup?daysOld=${daysOld}`, {
            method: 'POST',
        });
    }

    // Rebuild schedules for all users
    async rebuildAllSchedules(): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>('/api/admin/maintenance/rebuild-schedules', {
            method: 'POST',
        });
    }

    // Update inventory for all medicines
    async updateAllInventories(): Promise<BatchProcessResult> {
        return this.makeRequest<BatchProcessResult>('/api/admin/maintenance/update-inventories', {
            method: 'POST',
        });
    }
}