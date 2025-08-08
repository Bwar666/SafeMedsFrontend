// AiWarningTypes.ts
export interface AiEvaluationResponse {
    id: string;
    medicineName: string;
    riskType: AiWarningType;
    allergyName?: string;
    targetMedicineName?: string;
    message: string;
    severity: WarningSeverity;
    status: AiWarningStatus;
    source: AiWarningSource;
    details?: string;
    createdAt: string;
}

export interface AiWarningResponse {
    id: string;
    seen: boolean;
    resolved: boolean;
    medicineName: string;
    allergyName?: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
    evaluationResult: AiEvaluationResponse;
}

export const WarningSeverity = {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
} as const;

export const AiWarningType = {
    ALLERGY_CONFLICT: 'ALLERGY_CONFLICT',
    INTERACTION_CONFLICT: 'INTERACTION_CONFLICT',
    OVERDOSE_WARNING: 'OVERDOSE_WARNING',
    DUPLICATE_MEDICINE: 'DUPLICATE_MEDICINE',
    TIMING_CONFLICT: 'TIMING_CONFLICT',
    FOOD_INSTRUCTION_ISSUE: 'FOOD_INSTRUCTION_ISSUE',
    NO_RISK: 'NO_RISK'
} as const;

export const AiWarningStatus = {
    PENDING: 'PENDING',
    FAILED: 'FAILED',
    COMPLETED: 'COMPLETED'
} as const;

export const AiWarningSource = {
    AI: 'AI',
    MANUAL: 'MANUAL',
    FALLBACK: 'FALLBACK'
} as const;

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}

export type WarningSeverity = typeof WarningSeverity[keyof typeof WarningSeverity];
export type AiWarningType = typeof AiWarningType[keyof typeof AiWarningType];
export type AiWarningStatus = typeof AiWarningStatus[keyof typeof AiWarningStatus];
export type AiWarningSource = typeof AiWarningSource[keyof typeof AiWarningSource];