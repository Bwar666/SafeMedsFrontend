import React from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { t, changeLanguage, currentLanguage, isRTL } = useLanguage();
    const { isDark, toggleTheme } = useTheme();

    const resetApp = async (): Promise<void> => {
        try {
            await Promise.all([
                AsyncStorage.removeItem('onboarding_completed'),
                AsyncStorage.removeItem('profile_created'),
                AsyncStorage.removeItem('user_profile')
            ]);

            Alert.alert(
                'App Reset',
                'All app data cleared. Restarting onboarding flow...',
                [{
                    text: 'OK',
                    onPress: () => navigation.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }],
                    })
                }]
            );
        } catch (error) {
            console.log('Error resetting app:', error);
            Alert.alert('Error', 'Failed to reset app data');
        }
    };

    const getNextLanguage = () => {
        const languages = { en: 'ar', ar: 'ku', ku: 'en' } as const;
        return languages[currentLanguage as keyof typeof languages];
    };

    const ActionButton = ({
                              title,
                              onPress,
                              bgColor = 'bg-indigo-500'
                          }: {
        title: string;
        onPress: () => void;
        bgColor?: string;
    }) => (
        <TouchableOpacity
            className={`${bgColor} py-3 px-6 rounded-lg items-center`}
            onPress={onPress}
        >
            <Text className="text-white text-base font-semibold">{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            <View className={`flex-1 p-5 justify-center items-center ${isRTL ? 'rtl' : 'ltr'}`}>
                {/* Header */}
                <Text className={`text-3xl font-bold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('welcome')}
                </Text>

                {/* Status Display */}
                <Text className={`text-base mb-2 text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    Current Language: {currentLanguage.toUpperCase()}
                </Text>
                <Text className={`text-base mb-10 text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    Current Theme: {isDark ? 'Dark' : 'Light'}
                </Text>

                {/* Action Buttons */}
                <View className="w-full gap-4">
                    <ActionButton
                        title="Toggle Theme"
                        onPress={toggleTheme}
                    />

                    <ActionButton
                        title="Change Language"
                        onPress={() => changeLanguage(getNextLanguage())}
                        bgColor="bg-purple-500"
                    />

                    <ActionButton
                        title="🔄 Reset Complete App (Test)"
                        onPress={resetApp}
                        bgColor="bg-red-500"
                    />
                </View>

                {/* Medicine Schedule Placeholder */}
                <View className={`mt-10 p-5 rounded-xl w-full items-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <Text className={`text-lg font-semibold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        📅 Todays Medicine Schedule
                    </Text>
                    <Text className={`text-sm text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                        Your medicine schedule will appear here
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}