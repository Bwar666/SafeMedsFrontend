// userTypes.ts
export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate: string;
    languagePreference: 'ENGLISH' | 'ARABIC' | 'KURDISH';
    themePreference: 'LIGHT' | 'DARK';
    allergies: Array<{
        name: string;
        description: string;
    }>;
}

export interface SafeMedUser {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate: string;
    languagePreference: 'ENGLISH' | 'ARABIC' | 'KURDISH';
    themePreference: 'LIGHT' | 'DARK';
    allergies: Array<{
        id: string;
        name: string;
        description: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: any;
}