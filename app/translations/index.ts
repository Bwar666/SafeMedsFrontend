import { en } from './en';
import { ar } from './ar';
import { ku } from './ku';

// Define the supported language codes
export type LanguageCode = 'en' | 'ar' | 'ku';

// Get the type from the English translations (as the base)
export type TranslationKeys = keyof typeof en;

// Ensure all translation objects conform to the same structure
type TranslationObject = Record<TranslationKeys, string>;

// Define translations object with proper typing
export const translations: Record<LanguageCode, TranslationObject> = {
    en: en as TranslationObject,
    ar: ar as TranslationObject,
    ku: ku as TranslationObject,
} as const;

// Type for the entire translations object
export type Translations = typeof translations;

// Helper function to get translation with fallback
export const getTranslation = (
    language: LanguageCode,
    key: TranslationKeys,
    fallbackLanguage: LanguageCode = 'en'
): string => {
    const translation = translations[language]?.[key] || translations[fallbackLanguage]?.[key] || key;
    return translation;
};

// Helper function to check if a translation key exists
export const hasTranslation = (language: LanguageCode, key: TranslationKeys): boolean => {
    return key in translations[language] && translations[language][key].trim() !== '';
};

// Helper function to get all available languages
export const getAvailableLanguages = (): LanguageCode[] => {
    return Object.keys(translations) as LanguageCode[];
};

// Helper function to validate language code
export const isValidLanguageCode = (code: string): code is LanguageCode => {
    return getAvailableLanguages().includes(code as LanguageCode);
};

// RTL language detection
export const isRTLLanguage = (language: LanguageCode): boolean => {
    return ['ar', 'ku'].includes(language);
};

// Language display names
export const getLanguageDisplayName = (language: LanguageCode): string => {
    const displayNames: Record<LanguageCode, string> = {
        en: 'English',
        ar: 'العربية',
        ku: 'کوردی'
    };
    return displayNames[language];
};

// Language flags/emojis
export const getLanguageFlag = (language: LanguageCode): string => {
    const flags: Record<LanguageCode, string> = {
        en: '🇺🇸',
        ar: '🇮🇶',
        ku: '❤️☀️💚'
    };
    return flags[language];
};

// Export all translation keys for type checking
export const TRANSLATION_KEYS = Object.keys(en) as TranslationKeys[];

// Export translation statistics
export const getTranslationStats = () => {
    const enKeys = Object.keys(en).length;
    const arKeys = Object.keys(ar).length;
    const kuKeys = Object.keys(ku).length;

    return {
        total: enKeys,
        coverage: {
            en: 100,
            ar: Math.round((arKeys / enKeys) * 100),
            ku: Math.round((kuKeys / enKeys) * 100)
        },
        keys: {
            en: enKeys,
            ar: arKeys,
            ku: kuKeys
        }
    };
};

// Validation function to check translation completeness
export const validateTranslations = (): { isValid: boolean; missingKeys: Record<LanguageCode, string[]> } => {
    const baseKeys = Object.keys(en) as TranslationKeys[];
    const missingKeys: Record<LanguageCode, string[]> = {
        en: [],
        ar: [],
        ku: []
    };

    (Object.keys(translations) as LanguageCode[]).forEach(lang => {
        baseKeys.forEach(key => {
            if (!(key in translations[lang]) || !translations[lang][key].trim()) {
                missingKeys[lang].push(key);
            }
        });
    });

    const isValid = Object.values(missingKeys).every(keys => keys.length === 0);

    return { isValid, missingKeys };
};