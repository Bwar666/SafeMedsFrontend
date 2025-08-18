// medicineStatsTypes.ts
import {FoodInstruction} from "@/app/services/medicine/medicine/MedicineServiceTypes";

export interface DailyMedicineSchedule {
    date: string; // YYYY-MM-DD format
    intakeEvents: IntakeEvent[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    totalPending: number;
}

export interface IntakeEvent {
    id: string;
    medicineId: string;
    medicineName: string;
    medicineIcon?: string;
    medicineColor?: string;
    foodInstruction?: FoodInstruction;
    refillReminderThreshold: number;
    currentInventory : number;
    scheduledDateTime: string;
    actualDateTime?: string;
    status: IntakeStatus;
    scheduledAmount: number;
    actualAmount?: number;
    note?: string;
    skipReason?: string;
    canTakeLate?: boolean;
    inventoryAvailable?: boolean;
    formattedDosage?: string;
}

export interface WeeklyStats {
    weekStartDate: string;
    weekEndDate: string;
    dailySchedules: DailyMedicineSchedule[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    adherenceRate: number;
    bestDay: string;
    worstDay: string;
}

export interface AdherenceStats {
    period: 'today' | 'week' | 'month';
    adherenceRate: number;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
    onTimeRate: number;
    lateRate: number;
}

// Enums
export enum IntakeStatus {
    SCHEDULED = 'SCHEDULED',
    TAKEN = 'TAKEN',
    MISSED = 'MISSED',
    SKIPPED = 'SKIPPED'
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}