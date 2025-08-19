// AppNavigator.tsx - Complete fixed version
import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileCreationScreen from '../screens/user/ProfileCreationScreen';
import MainTabNavigator from './MainTabNavigator';
import AddMedicineScreen from '../screens/medicine/AddMedicineScreen';
import MedicineDetailScreen from '../screens/medicine/MedicineDetailScreen';
import EditMedicineScreen from '../screens/medicine/EditMedicineScreen';
import AIWarningDetailScreen from '../screens/ai/AIWarningDetailScreen';
import ProfileManagementScreenScreen from '../screens/user/ProfileManagementScreen';
import AllergyManagementScreen from '../screens/allergy/AllergyManagementScreen';
import { AiWarningResponse } from "@/app/services/ai";
import { UserStorageService } from "@/app/services/user";

// Updated Navigation Types
export type RootStackParamList = {
    Onboarding: undefined;
    ProfileCreation: undefined;
    HomeTab: {
        dateTitle?: string;
    };
    AddMedicine: undefined;
    Profile: undefined;
    AllergyManagement: undefined;
    MedicineDetail: {
        medicineId: string;
    };
    EditMedicine: {
        medicineId: string;
    };
    AIWarningDetail: {
        warning: AiWarningResponse;
    };
    TestPermission: undefined; // ADDED for testing
};

type RouteKey = keyof RootStackParamList;

const Stack = createStackNavigator<RootStackParamList>();

// Loading Screen Component
const LoadingScreen: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <View className="items-center">
            <Image
                source={require('../../assets/images/playstore.png')}
                style={{ width: 120, height: 120, marginBottom: 24, borderRadius: 20 }}
                resizeMode="contain"
            />
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

// Test Permission Screen Component - ADDED
const TestPermissionScreen: React.FC = () => {
    return (
        <View className="flex-1 justify-center p-4 bg-white">
            <Text className="text-xl font-bold mb-4 text-center">Permission Test Screen</Text>
            <Text className="text-center text-gray-600">
                Navigate to this screen to test permissions
            </Text>
        </View>
    );
};

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
            return 'HomeTab';
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

    const screenOptions = {
        headerShown: false,
        gestureEnabled: false, // Disable gestures by default
    };

    if (isLoading || !initialRoute) {
        return <LoadingScreen isDark={isDark} />;
    }

    return (
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
            {/* Authentication Screens */}
            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ gestureEnabled: true }} // Enable only for onboarding
            />
            <Stack.Screen
                name="ProfileCreation"
                component={ProfileCreationScreen}
                options={{ gestureEnabled: true }} // Enable only for profile creation
            />

            {/* Main App */}
            <Stack.Screen
                name="HomeTab"
                component={MainTabNavigator}
            />
            <Stack.Screen
                name="AddMedicine"
                component={AddMedicineScreen}
                options={{ animation: "fade_from_bottom" }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileManagementScreenScreen}
                options={{ animation: "fade" }}
            />
            <Stack.Screen
                name="AllergyManagement"
                component={AllergyManagementScreen}
                options={{ animation: "fade" }}
            />
            <Stack.Screen
                name="MedicineDetail"
                component={MedicineDetailScreen}
                options={{ animation: "fade_from_bottom" }}
            />
            <Stack.Screen
                name="EditMedicine"
                component={EditMedicineScreen}
                options={{ animation: "fade_from_bottom" }}
            />
            <Stack.Screen
                name="AIWarningDetail"
                component={AIWarningDetailScreen}
                options={{ animation: "fade_from_bottom" }}
            />

            {/* Test Screen - ADDED for permission testing */}
            <Stack.Screen
                name="TestPermission"
                component={TestPermissionScreen}
                options={{
                    animation: "fade_from_bottom",
                    headerShown: true,
                    title: "Test Permissions"
                }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;