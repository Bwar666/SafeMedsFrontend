import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { translations, LanguageCode, TranslationKeys } from '../translations';

// Define the context value interface
interface LanguageContextValue {
    currentLanguage: LanguageCode;
    isRTL: boolean;
    changeLanguage: (languageCode: LanguageCode) => Promise<void>;
    t: (key: TranslationKeys) => string;
}

// Define provider props interface
interface LanguageProviderProps {
    children: ReactNode;
}

// Create context with undefined as default
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// Custom hook to use the language context
export const useLanguage = (): LanguageContextValue => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// Language Provider Component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
    const [isRTL, setIsRTL] = useState<boolean>(false);

    // Load saved language on app start
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async (): Promise<void> => {
        try {
            const savedLanguage = await AsyncStorage.getItem('app_language');
            if (savedLanguage && isValidLanguageCode(savedLanguage)) {
                await changeLanguage(savedLanguage);
            }
        } catch (error) {
            console.log('Error loading language:', error);
        }
    };

    // Type guard to check if string is valid language code
    const isValidLanguageCode = (code: string): code is LanguageCode => {
        return (code === 'en' || code === 'ar' || code === 'ku');
    };

    const changeLanguage = async (languageCode: LanguageCode): Promise<void> => {
        try {
            // Update state
            setCurrentLanguage(languageCode);

            // Set RTL for Arabic and Kurdish
            const rtlLanguages: LanguageCode[] = ['ar', 'ku'];
            const shouldBeRTL = rtlLanguages.includes(languageCode);
            setIsRTL(shouldBeRTL);

            // Update React Native's layout direction
            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);

            // Save to storage
            await AsyncStorage.setItem('app_language', languageCode);

        } catch (error) {
            console.log('Error changing language:', error);
        }
    };

    // Fixed translation function with proper type safety
    const t = (key: TranslationKeys): string => {
        // Get the current language translations
        const currentTranslations = translations[currentLanguage];

        // Type assertion to ensure we can access the key
        const currentValue = (currentTranslations as Record<TranslationKeys, string>)[key];
        const fallbackValue = (translations.en as Record<TranslationKeys, string>)[key];

        return currentValue || fallbackValue || key;
    };

    const value: LanguageContextValue = {
        currentLanguage,
        isRTL,
        changeLanguage,
        t,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};