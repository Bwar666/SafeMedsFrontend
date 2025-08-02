import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import contexts
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import screens
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';

// Loading component interface
interface LoadingScreenProps {
    isDark: boolean;
}

// Simple loading screen component
const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDark }) => (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <Text className={`text-lg font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
            Loading SafeMed...
        </Text>
    </View>
);

// Main App Content Component (wrapped with contexts)
const AppContent: React.FC = () => {
    const { theme, isDark } = useTheme();

    // State with proper typing
    const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Check if user has completed onboarding
    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async (): Promise<void> => {
        try {
            const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_completed');
            if (hasCompletedOnboarding === 'true') {
                setShowOnboarding(false);
            }
        } catch (error) {
            console.log('Error checking onboarding status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnboardingComplete = async (): Promise<void> => {
        try {
            await AsyncStorage.setItem('onboarding_completed', 'true');
            setShowOnboarding(false);
        } catch (error) {
            console.log('Error saving onboarding status:', error);
            // Even if saving fails, we can still proceed to the app
            setShowOnboarding(false);
        }
    };

    // Show loading screen while checking onboarding status
    if (isLoading) {
        return <LoadingScreen isDark={isDark} />;
    }

    return (
        <>
            <StatusBar
                style={isDark ? 'light' : 'dark'}
                backgroundColor={theme.background}
                translucent={false}
            />
            {showOnboarding ? (
                <OnboardingScreen onComplete={handleOnboardingComplete} />
            ) : (
                <HomeScreen />
            )}
        </>
    );
};

// Root App Component with Providers
const App: React.FC = () => {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </LanguageProvider>
    );
};

export default App;