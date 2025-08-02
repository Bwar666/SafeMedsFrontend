import React from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const HomeScreen: React.FC = () => {
    // Context hooks with proper typing
    const { t, changeLanguage, currentLanguage, isRTL } = useLanguage();
    const { isDark, toggleTheme } = useTheme();

    // Function to reset onboarding (for testing)
    const resetOnboarding = async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('onboarding_completed');
            Alert.alert(
                'Onboarding Reset',
                'Please restart the app to see the onboarding again.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.log('Error resetting onboarding:', error);
            Alert.alert('Error', 'Failed to reset onboarding');
        }
    };

    // Function to cycle through languages
    const cycleLanguage = (): void => {
        const languages: Array<'en' | 'ar' | 'ku'> = ['en', 'ar', 'ku'];
        const currentIndex = languages.indexOf(currentLanguage);
        const nextIndex = (currentIndex + 1) % languages.length;
        changeLanguage(languages[nextIndex]);
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            <View className={`flex-1 p-5 justify-center items-center ${isRTL ? 'rtl' : 'ltr'}`}>
                {/* Header */}
                <Text className={`text-3xl font-bold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('welcome')}
                </Text>

                {/* Current Language Display */}
                <Text className={`text-base mb-2 text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    Current Language: {currentLanguage.toUpperCase()}
                </Text>

                {/* Current Theme Display */}
                <Text className={`text-base mb-10 text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    Current Theme: {isDark ? 'Dark' : 'Light'}
                </Text>

                {/* Test Buttons */}
                <View className="w-full gap-4">
                    <TouchableOpacity
                        className="bg-indigo-500 py-3 px-6 rounded-lg items-center shadow-sm"
                        onPress={toggleTheme}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-semibold">
                            🌓 Toggle Theme
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-purple-500 py-3 px-6 rounded-lg items-center shadow-sm"
                        onPress={cycleLanguage}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-semibold">
                            🌐 Change Language
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-red-500 py-3 px-6 rounded-lg items-center shadow-sm"
                        onPress={resetOnboarding}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-semibold">
                            🔄 Reset Onboarding (Test)
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Placeholder for future content */}
                <View className={`mt-10 p-5 rounded-xl w-full items-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <Text className={`text-lg font-semibold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        📅 Todays Medicine Schedule
                    </Text>
                    <Text className={`text-sm text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                        Your medicine schedule will appear here
                    </Text>
                </View>

                {/* Development Info */}
                <View className={`mt-6 p-4 rounded-lg w-full ${isDark ? 'bg-slate-800/50' : 'bg-white/50'}`}>
                    <Text className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                        SafeMed v1.0 - Built with React Native & TypeScript
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;