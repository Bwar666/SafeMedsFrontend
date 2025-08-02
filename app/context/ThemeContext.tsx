import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

// Define theme mode type
type ThemeMode = 'light' | 'dark';

// Define theme colors interface
interface ThemeColors {
    background: string;
    surface: string;
    primary: string;
    primaryDark: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    card: string;
}

// SafeMed custom colors - Light theme
const lightTheme: ThemeColors = {
    background: '#EFF6FF',      // bg-blue-50
    surface: '#F3F4F6',         // bg-gray-100
    primary: '#6366F1',         // bg-indigo-500
    primaryDark: '#4F46E5',     // bg-indigo-600
    secondary: '#8B5CF6',       // bg-purple-500
    text: '#1F2937',            // text-gray-800
    textSecondary: '#6B7280',   // text-gray-500
    border: '#D1D5DB',          // border-gray-300
    success: '#10B981',         // bg-emerald-500
    warning: '#F59E0B',         // bg-amber-500
    error: '#EF4444',           // bg-red-500
    card: '#FFFFFF',            // bg-white
};

// SafeMed custom colors - Dark theme
const darkTheme: ThemeColors = {
    background: '#0F172A',      // bg-slate-900
    surface: '#1E293B',         // bg-slate-800
    primary: '#6366F1',         // bg-indigo-500
    primaryDark: '#4F46E5',     // bg-indigo-600
    secondary: '#8B5CF6',       // bg-purple-500
    text: '#F8FAFC',            // text-slate-100
    textSecondary: '#CBD5E1',   // text-slate-300
    border: '#334155',          // border-slate-600
    success: '#10B981',         // bg-emerald-500
    warning: '#F59E0B',         // bg-amber-500
    error: '#EF4444',           // bg-red-500
    card: '#1E293B',            // bg-slate-800
};

// Define the context value interface
interface ThemeContextValue {
    isDark: boolean;
    theme: ThemeColors;
    toggleTheme: () => Promise<void>;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
}

// Define provider props interface
interface ThemeProviderProps {
    children: ReactNode;
}

// Create context with undefined as default
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Custom hook to use the theme context
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDark, setIsDark] = useState<boolean>(false);
    const [theme, setTheme] = useState<ThemeColors>(lightTheme);

    // Load saved theme on app start
    useEffect(() => {
        loadSavedTheme();
    }, []);

    // Listen to system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
            checkAutoTheme();
        });

        return () => subscription?.remove();
    }, []);

    const loadSavedTheme = async (): Promise<void> => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme && isValidThemeMode(savedTheme)) {
                const isThemeDark = savedTheme === 'dark';
                setIsDark(isThemeDark);
                setTheme(isThemeDark ? darkTheme : lightTheme);
            } else {
                checkAutoTheme();
            }
        } catch (error) {
            console.log('Error loading theme:', error);
        }
    };

    // Type guard to check if string is valid theme mode
    const isValidThemeMode = (mode: string): mode is ThemeMode => {
        return mode === 'light' || mode === 'dark';
    };

    const checkAutoTheme = (): void => {
        const systemTheme = Appearance.getColorScheme();
        const shouldBeDark = systemTheme === 'dark';
        setIsDark(shouldBeDark);
        setTheme(shouldBeDark ? darkTheme : lightTheme);
    };

    const toggleTheme = async (): Promise<void> => {
        try {
            const newIsDark = !isDark;
            setIsDark(newIsDark);
            setTheme(newIsDark ? darkTheme : lightTheme);

            await AsyncStorage.setItem('app_theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
            console.log('Error saving theme:', error);
        }
    };

    const setThemeMode = async (mode: ThemeMode): Promise<void> => {
        try {
            const shouldBeDark = mode === 'dark';
            setIsDark(shouldBeDark);
            setTheme(shouldBeDark ? darkTheme : lightTheme);

            await AsyncStorage.setItem('app_theme', mode);
        } catch (error) {
            console.log('Error setting theme:', error);
        }
    };

    const value: ThemeContextValue = {
        isDark,
        theme,
        toggleTheme,
        setThemeMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};