// notificationTypes.ts
export interface NotificationResult {
    success: boolean;
    message: string;
    timestamp: string;
    operation: string;
}

export interface NotificationStatus {
    missedDosesProcessed: boolean;
    upcomingIntakesChecked: boolean;
    lowInventoryChecked: boolean;
    lastProcessed: {
        missedDoses?: string;
        upcomingIntakes?: string;
        lowInventory?: string;
        userMissedDoses?: string;
    };
}

export interface NotificationSchedule {
    enabled: boolean;
    frequency: 'manual' | 'hourly' | 'daily';
    lastRun?: string;
    nextRun?: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}