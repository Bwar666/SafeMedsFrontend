export interface MedicineRequest {
    name: string;
    form: MedicineForm;
    conditionReason?: string;
    frequencyType: FrequencyType;
    frequencyConfig?: FrequencyConfig;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration?: number;
    refillReminderThreshold?: number;
    foodInstruction?: FoodInstruction;
    currentInventory?: number;
    totalInventory?: number;
    autoDeductInventory?: boolean;
    notificationsEnabled?: boolean;
    missedDoseThresholdMinutes?: number;
    allowLateIntake?: boolean;
    lateIntakeWindowHours?: number;
    icon?: string;
    color?: string;
}

export interface MedicineResponse {
    id: string;
    name: string;
    form: MedicineForm;
    conditionReason?: string;
    frequencyType: FrequencyType;
    frequencyConfig?: FrequencyConfig;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration?: number;
    refillReminderThreshold?: number;
    foodInstruction?: FoodInstruction;
    icon?: string;
    color?: string;
    isActive: boolean;
    formattedDosage?: string;
    currentInventory?: number;
    totalInventory?: number;
    autoDeductInventory?: boolean;
    notificationsEnabled?: boolean;
    missedDoseThresholdMinutes?: number;
    allowLateIntake?: boolean;
    lateIntakeWindowHours?: number;
}

export interface IntakeSchedule {
    time: string; // HH:mm format
    amount: number;
}

export interface FrequencyConfig {
    intervalDays?: number;
    specificDays?: DayOfWeek[];
    cycleActiveDays?: number;
    cycleRestDays?: number;
}

export interface AllergyResponse {
    id: string;
    name: string;
    description?: string;
}

// Enums
export enum MedicineForm {
    PILL = 'PILL',
    CAPSULE = 'CAPSULE',
    HARDCAPSULE = 'HARDCAPSULE',
    TABLET = 'TABLET',
    INJECTION = 'INJECTION',
    LIQUID = 'LIQUID',
    DROPS = 'DROPS',
    INHALER = 'INHALER',
    POWDER = 'POWDER',
    CREAM = 'CREAM',
    GUMMYBEAR = 'GUMMYBEAR',
    PATCH = 'PATCH',
    GEL = 'GEL',
    SPRAY = 'SPRAY',
    OTHER = 'OTHER'
}

export enum FrequencyType {
    DAILY = 'DAILY',
    EVERY_OTHER_DAY = 'EVERY_OTHER_DAY',
    SPECIFIC_DAYS_OF_WEEK = 'SPECIFIC_DAYS_OF_WEEK',
    EVERY_X_DAYS = 'EVERY_X_DAYS',
    EVERY_X_WEEKS = 'EVERY_X_WEEKS',
    EVERY_X_MONTHS = 'EVERY_X_MONTHS',
    CYCLE_BASED = 'CYCLE_BASED'
}

export enum FoodInstruction {
    BEFORE_EATING = 'BEFORE_EATING',
    WHILE_EATING = 'WHILE_EATING',
    AFTER_EATING = 'AFTER_EATING',
    DOES_NOT_MATTER = 'DOES_NOT_MATTER',
    EMPTY_STOMACH = 'EMPTY_STOMACH'
}

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY'
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}