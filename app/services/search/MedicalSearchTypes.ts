// medicalSearchTypes.ts
export interface SearchSuggestion {
    value: string;
    displayName: string;
    description?: string;
    source: string;
    category: string;
    code?: string;
}

export interface SearchResponse {
    suggestions: SearchSuggestion[];
    query: string;
    category: string;
    hasMore: boolean;
    source: string;
}

export interface SearchFilters {
    limit?: number;
    minLength?: number;
}

// Search Categories
export enum SearchCategory {
    MEDICINES = 'medicines',
    CONDITIONS = 'conditions',
    ALLERGIES = 'allergies'
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}