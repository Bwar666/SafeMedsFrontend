import { CreateUserRequest, SafeMedUser, ApiError } from './UserTypes';

const COMPUTER_IP = '192.168.1.4';
const API_BASE_URL = __DEV__
    ? `http://${COMPUTER_IP}:8081`
    : 'https://your-production-api.com';

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

export class UserService {
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

    async createUser(userData: CreateUserRequest): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>('/api/users/create', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getUser(userId: string): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>(`/api/users/${userId}`, {
            method: 'GET',
        });
    }

    async updateUser(userId: string, userData: Partial<CreateUserRequest>): Promise<SafeMedUser> {
        return this.makeRequest<SafeMedUser>(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(userId: string): Promise<{ success: boolean }> {
        return this.makeRequest<{ success: boolean }>(`/api/users/${userId}`, {
            method: 'DELETE',
        });
    }
}