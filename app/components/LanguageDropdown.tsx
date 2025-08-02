import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../translations';

// Language data
const languages = [
    { code: 'en' as LanguageCode, name: 'English', flag: '🇺🇸' },
    { code: 'ar' as LanguageCode, name: 'العربية', flag: '🇮🇶' },
    { code: 'ku' as LanguageCode, name: 'کوردی', flag: '❤️☀️💚' },
];

interface LanguageDropdownProps {
    onLanguageSelect?: (languageCode: LanguageCode) => void; // Optional callback
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ onLanguageSelect }) => {
    const { isDark } = useTheme();
    const { currentLanguage, changeLanguage, isRTL } = useLanguage();
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const dropdownAnimation = useRef(new Animated.Value(0)).current;

    // Get current language info
    const currentLanguageInfo = languages.find(lang => lang.code === currentLanguage) || languages[0];

    // Toggle dropdown
    const toggleDropdown = useCallback((): void => {
        const toValue = showDropdown ? 0 : 1;
        setShowDropdown(!showDropdown);

        Animated.spring(dropdownAnimation, {
            toValue,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    }, [showDropdown, dropdownAnimation]);

    // Select language
    const selectLanguage = useCallback((languageCode: LanguageCode): void => {
        changeLanguage(languageCode);

        // Close dropdown
        Animated.spring(dropdownAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start(() => {
            setShowDropdown(false);
        });

        // Call optional callback
        onLanguageSelect?.(languageCode);
    }, [changeLanguage, dropdownAnimation, onLanguageSelect]);

    return (
        <View className="relative">
            {/* Dropdown Button */}
            <TouchableOpacity
                onPress={toggleDropdown}
                className={`px-4 py-3 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm flex-row items-center gap-2 min-w-20`}
                activeOpacity={0.7}
            >
                <Text className="text-lg">{currentLanguageInfo.flag}</Text>
                <Text className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {currentLanguage.toUpperCase()}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {showDropdown ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showDropdown && (
                <Animated.View
                    style={{
                        transform: [
                            {
                                translateY: dropdownAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-10, 0],
                                }),
                            },
                            {
                                scale: dropdownAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.95, 1],
                                }),
                            },
                        ],
                        opacity: dropdownAnimation,
                    }}
                    className={`absolute top-14 ${isRTL ? 'right-0' : 'left-0'} ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'} z-50 min-w-44`}
                >
                    {languages.map((lang, index) => (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => selectLanguage(lang.code)}
                            className={`flex-row items-center px-4 py-3 ${
                                currentLanguage === lang.code
                                    ? isDark ? 'bg-slate-700' : 'bg-gray-100'
                                    : ''
                            } ${
                                index === 0 ? 'rounded-t-xl' :
                                    index === languages.length - 1 ? 'rounded-b-xl' : ''
                            }`}
                            activeOpacity={0.7}
                        >
                            <Text className="text-lg mr-3">{lang.flag}</Text>
                            <View className="flex-1">
                                <Text className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                    {lang.name}
                                </Text>
                                <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {lang.code.toUpperCase()}
                                </Text>
                            </View>
                            {currentLanguage === lang.code && (
                                <Text className="text-indigo-500 text-sm">✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </View>
    );
};

export default LanguageDropdown;