import { en } from './en';
import { ar } from './ar';
import { ku } from './ku';

// Define the supported language codes
export type LanguageCode = 'en' | 'ar' | 'ku';

// Get the type from the English translations (as the base)
export type TranslationKeys = keyof typeof en;

// Define translations object with proper typing
export const translations = {
    en,
    ar,
    ku,
} as const;

// Type for the entire translations object
export type Translations = typeof translations;