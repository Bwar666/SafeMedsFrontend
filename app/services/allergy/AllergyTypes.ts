// AllergyTypes.ts
export interface AllergyRequest {
    name: string;
    description?: string;
}

export interface AllergyResponse {
    id: string;
    name: string;
    description?: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}