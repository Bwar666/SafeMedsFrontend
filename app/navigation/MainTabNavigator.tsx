import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, Pill, AlertTriangle, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import MedicinesScreen from '../screens/MedicinesScreen';
import AIWarningsScreen from '../screens/AIWarningsScreen';
import SettingsModal from '../components/SettingsModal';

// Tab Navigator Types
export type MainTabParamList = {
    HomeTab: undefined;
    MedicinesTab: undefined;
    AIWarningsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// User Profile Button Component
const UserProfileButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
    const { isDark } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`w-10 h-10 rounded-full items-center justify-center ${
                isDark ? 'bg-slate-800' : 'bg-white'
            } shadow-sm mr-4`}
            activeOpacity={0.7}
        >
            <User
                size={20}
                color={isDark ? '#F8FAFC' : '#1F2937'}
            />
        </TouchableOpacity>
    );
};

// Tab Bar Icon Component
const TabBarIcon: React.FC<{
    route: keyof MainTabParamList;
    focused: boolean;
    color: string;
    size: number;
}> = ({ route, focused, color, size }) => {
    const iconSize = focused ? size + 2 : size;

    const icons = {
        HomeTab: Home,
        MedicinesTab: Pill,
        AIWarningsTab: AlertTriangle,
    };

    const IconComponent = icons[route];
    return <IconComponent size={iconSize} color={color} />;
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();
    const [showSettings, setShowSettings] = React.useState(false);

    const tabBarOptions = {
        headerShown: true,
        headerStyle: {
            backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
        },
        headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600' as const,
            color: isDark ? '#F8FAFC' : '#1F2937',
        },
        headerRight: () => (
            <UserProfileButton onPress={() => setShowSettings(true)} />
        ),
        tabBarStyle: {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#334155' : '#E5E7EB',
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#6B7280',
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500' as const,
            marginTop: 4,
        },
        tabBarIconStyle: {
            marginTop: 4,
        },
    };

    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    ...tabBarOptions,
                    tabBarIcon: ({ focused, color, size }) => (
                        <TabBarIcon
                            route={route.name as keyof MainTabParamList}
                            focused={focused}
                            color={color}
                            size={size}
                        />
                    ),
                })}
                initialRouteName="HomeTab"
            >
                <Tab.Screen
                    name="HomeTab"
                    component={HomeScreen}
                    options={{
                        title: t('home') || 'Home',
                        tabBarLabel: t('home') || 'Home',
                    }}
                />
                <Tab.Screen
                    name="MedicinesTab"
                    component={MedicinesScreen}
                    options={{
                        title: t('medicines') || 'Medicines',
                        tabBarLabel: t('medicines') || 'Medicines',
                    }}
                />
                <Tab.Screen
                    name="AIWarningsTab"
                    component={AIWarningsScreen}
                    options={{
                        title: t('aiWarnings') || 'ai Warnings',
                        tabBarLabel: t('warnings') || 'Warnings',
                    }}
                />
            </Tab.Navigator>

            {/* Settings Modal */}
            <SettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </>
    );
};

export default MainTabNavigator;