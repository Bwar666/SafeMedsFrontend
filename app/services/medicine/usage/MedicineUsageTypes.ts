// medicineUsageTypes.ts
import {FoodInstruction, IntakeSchedule, MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";

export interface TakeMedicineRequest {
    intakeEventId: string;
    actualTakeTime?: string; // ISO datetime string
    actualDosageAmount: number;
    currentInventory : number;
    note?: string;
    deductFromInventory?: boolean;
}

export interface SkipMedicineRequest {
    intakeEventId: string;
    skipReason: string;
    note?: string;
}
export interface MedicineUsageResponse {
    intakeEventId: string;
    medicineId: string;
    medicineName: string;
    status: IntakeStatus;
    scheduledDateTime: string;
    actualDateTime?: string;
    scheduledAmount: number;
    actualAmount?: number;
    note?: string;
    skipReason?: string;
    remainingInventory?: number;
    inventoryLow?: boolean;
    message?: string;
}

export interface IntakeEvent {
    id: string;
    medicineId: string;
    medicineName: string;
    medicineIcon?: string;
    medicineColor?: string;
    medicineForm: MedicineForm;
    foodInstruction?: FoodInstruction;
    refillReminderThreshold: number;
    currentInventory : number;
    scheduledDateTime: string;
    actualDateTime?: string;
    status: IntakeStatus;
    scheduledAmount: number;
    actualAmount: number;
    note?: string;
    skipReason?: string;
    canTakeLate?: boolean;
    inventoryAvailable?: boolean;
    formattedDosage?: string;
}

export interface DailyMedicineSchedule {
    date: string; // YYYY-MM-DD format
    intakeEvents: IntakeEvent[];
    totalScheduled: number;
    totalTaken: number;
    totalSkipped: number;
    totalMissed: number;
    totalPending: number;
}

export interface InventoryUpdateRequest {
    newInventoryAmount: number;
    updateReason?: string;
    resetToFull?: boolean;
}

export interface MedicineResponse {
    id: string;
    name: string;
    form: string;
    conditionReason?: string;
    frequencyType: string;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration?: number;
    refillReminderThreshold?: number;
    foodInstruction?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    formattedDosage?: string;
}

// Enums
export enum IntakeStatus {
    SCHEDULED = 'SCHEDULED',
    TAKEN = 'TAKEN',
    MISSED = 'MISSED',
    SKIPPED = 'SKIPPED',
    PAUSED = 'PAUSED',
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}