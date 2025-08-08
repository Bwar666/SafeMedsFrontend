// medicineMaintenanceTypes.ts
export interface MaintenanceResult {
    success: boolean;
    message: string;
    processedCount?: number;
    errorCount?: number;
    details?: string[];
}

export interface SystemHealthCheck {
    status: 'healthy' | 'warning' | 'error';
    timestamp: string;
    checks: {
        database: boolean;
        notifications: boolean;
        scheduling: boolean;
        apiConnectivity: boolean;
    };
    metrics: {
        totalUsers: number;
        activeMedicines: number;
        pendingIntakes: number;
        overdueIntakes: number;
    };
}

export interface BatchProcessResult {
    operation: string;
    totalItems: number;
    processedItems: number;
    successCount: number;
    errorCount: number;
    startTime: string;
    endTime: string;
    errors: string[];
}

export interface MaintenanceSchedule {
    operation: string;
    scheduledTime: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
    lastRun?: string;
    nextRun: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}