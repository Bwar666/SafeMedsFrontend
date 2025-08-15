// medicineUsageApiService.ts
import {
    TakeMedicineRequest,
    SkipMedicineRequest,
    MedicineUsageResponse,
    DailyMedicineSchedule,
    IntakeEvent,
    InventoryUpdateRequest,
    MedicineResponse,
    ApiError
} from './MedicineUsageTypes';

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
        return null as any;
    }
};

// Medicine Usage API Service Class
export class MedicineUsageApiService {
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

    // Medicine Usage Operations
    // Take Medicine - POST /api/users/{userId}/medicines/take
    async takeMedicine(userId: string, request: TakeMedicineRequest): Promise<MedicineUsageResponse> {
        return this.makeRequest<MedicineUsageResponse>(`/api/users/${userId}/medicines/take`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Skip Medicine - POST /api/users/{userId}/medicines/skip
    async skipMedicine(userId: string, request: SkipMedicineRequest): Promise<MedicineUsageResponse> {
        return this.makeRequest<MedicineUsageResponse>(`/api/users/${userId}/medicines/skip`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Pause Medicine - POST /api/users/{userId}/medicines/{medicineId}/pause
    async pauseMedicine(userId: string, medicineId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/pause`, {
            method: 'POST',
        });
    }

    // Resume Medicine - POST /api/users/{userId}/medicines/{medicineId}/resume
    async resumeMedicine(userId: string, medicineId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/resume`, {
            method: 'POST',
        });
    }

    // Toggle Notifications - PUT /api/users/{userId}/medicines/{medicineId}/notifications
    async toggleNotifications(userId: string, medicineId: string, enabled: boolean): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/notifications?enabled=${enabled}`, {
            method: 'PUT',
        });
    }

    // Schedule Operations
    // Get Daily Schedule - GET /api/users/{userId}/medicines/schedule/daily
    async getDailySchedule(userId: string, date: string): Promise<DailyMedicineSchedule> {
        return this.makeRequest<DailyMedicineSchedule>(`/api/users/${userId}/medicines/schedule/daily?date=${date}`, {
            method: 'GET',
        });
    }

    // Get Weekly Schedule - GET /api/users/{userId}/medicines/schedule/weekly
    async getWeeklySchedule(userId: string, startDate: string): Promise<DailyMedicineSchedule[]> {
        return this.makeRequest<DailyMedicineSchedule[]>(`/api/users/${userId}/medicines/schedule/weekly?startDate=${startDate}`, {
            method: 'GET',
        });
    }

    // Get Upcoming Intakes - GET /api/users/{userId}/medicines/upcoming
    async getUpcomingIntakes(userId: string, hours: number = 24): Promise<IntakeEvent[]> {
        return this.makeRequest<IntakeEvent[]>(`/api/users/${userId}/medicines/upcoming?hours=${hours}`, {
            method: 'GET',
        });
    }

    // Get Overdue Intakes - GET /api/users/{userId}/medicines/overdue
    async getOverdueIntakes(userId: string): Promise<IntakeEvent[]> {
        return this.makeRequest<IntakeEvent[]>(`/api/users/${userId}/medicines/overdue`, {
            method: 'GET',
        });
    }

    // Inventory Operations
    // Update Inventory - PUT /api/users/{userId}/medicines/{medicineId}/inventory
    async updateInventory(userId: string, medicineId: string, request: InventoryUpdateRequest): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/${medicineId}/inventory`, {
            method: 'PUT',
            body: JSON.stringify(request),
        });
    }

    // Get Low Inventory Medicines - GET /api/users/{userId}/medicines/low-inventory
    async getLowInventoryMedicines(userId: string): Promise<MedicineResponse[]> {
        return this.makeRequest<MedicineResponse[]>(`/api/users/${userId}/medicines/low-inventory`, {
            method: 'GET',
        });
    }

    // Maintenance Operations
    // Process Missed Doses - POST /api/users/{userId}/medicines/process-missed
    async processMissedDoses(userId: string): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/process-missed`, {
            method: 'POST',
        });
    }

    // Mark Event as Missed - POST /api/users/{userId}/medicines/events/{intakeEventId}/mark-missed
    async markEventAsMissed(userId: string, intakeEventId: string, automatic: boolean = false): Promise<void> {
        return this.makeRequest<void>(`/api/users/${userId}/medicines/events/${intakeEventId}/mark-missed?automatic=${automatic}`, {
            method: 'POST',
        });
    }
}