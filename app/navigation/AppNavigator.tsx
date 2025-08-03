import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserStorageService } from '../services/userApi';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileCreationScreen from '../screens/ProfileCreationScreen';
import HomeScreen from '../screens/HomeScreen';

// Navigation Types
export type RootStackParamList = {
    Onboarding: undefined;
    ProfileCreation: undefined;
    Home: undefined;
};

type RouteKey = keyof RootStackParamList;

const Stack = createStackNavigator<RootStackParamList>();

// Loading Screen Component
const LoadingScreen: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <View className="items-center">
            <Text className="text-6xl mb-6">💊</Text>
            <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                SafeMed
            </Text>
            <Text className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Loading your medicine tracker...
            </Text>
            <View className="mt-8">
                <View className={`h-1 w-32 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                    <View className="h-full w-16 bg-indigo-500 rounded-full animate-pulse" />
                </View>
            </View>
        </View>
    </View>
);

// Main Navigator Component
const AppNavigator: React.FC = () => {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [initialRoute, setInitialRoute] = useState<RouteKey | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeApp();
    }, []);

    const determineInitialRoute = async (): Promise<RouteKey> => {
        const [hasCompletedOnboarding, hasCreatedProfile, storedUser] = await Promise.all([
            AsyncStorage.getItem('onboarding_completed'),
            UserStorageService.isProfileCreated(),
            UserStorageService.getStoredUser(),
        ]);

        if (hasCompletedOnboarding === 'true' && hasCreatedProfile && storedUser) {
            return 'Home';
        }

        if (hasCompletedOnboarding === 'true') {
            return 'ProfileCreation';
        }

        return 'Onboarding';
    };

    const initializeApp = async (): Promise<void> => {
        try {
            const route = await determineInitialRoute();
            setInitialRoute(route);
        } catch (error) {
            console.error('Error initializing app:', error);
            setInitialRoute('Onboarding');
        } finally {
            // Minimum loading time for better UX
            setTimeout(() => setIsLoading(false), 1000);
        }
    };

    const resetAppData = async (): Promise<void> => {
        try {
            console.log('🔄 Resetting app data...');

            await Promise.all([
                AsyncStorage.removeItem('onboarding_completed'),
                UserStorageService.clearUserData(),
            ]);

            console.log('✅ App data reset complete');

            // Restart initialization
            setIsLoading(true);
            setInitialRoute(null);
            await initializeApp();
        } catch (error) {
            console.error('❌ Error resetting app data:', error);
        }
    };

    const screenOptions = {
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }: any) => ({
            cardStyle: {
                transform: [{
                    translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                    }),
                }],
            },
        }),
    };

    if (isLoading || !initialRoute) {
        return <LoadingScreen isDark={isDark} />;
    }

    return (
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="ProfileCreation"
                component={ProfileCreationScreen}
                options={{ gestureEnabled: true }}
            />
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ gestureEnabled: false }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;