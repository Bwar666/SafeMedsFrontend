import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../translations';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

// Language data
const languages = [
    { code: 'en' as LanguageCode, name: 'English', flag: '🇺🇸' },
    { code: 'ar' as LanguageCode, name: 'العربية', flag: '🇮🇶' },
    { code: 'ku' as LanguageCode, name: 'کوردی', flag: '❤️☀️💚' },
];

interface LanguageDropdownProps {
    compact?: boolean;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ compact = false }) => {
    const { theme } = useTheme();
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
        setShowDropdown(false);
        Animated.timing(dropdownAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [changeLanguage, dropdownAnimation]);

    return (
        <View className={`relative ${compact ? 'w-full' : ''}`}>
            {/* Dropdown Button */}
            <TouchableOpacity
                onPress={toggleDropdown}
                style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border
                }}
                className="flex-row items-center justify-between py-2 px-3 rounded-lg border"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center">
                    {!compact && <Text className="text-lg mr-2">{currentLanguageInfo.flag}</Text>}
                    <Text style={{ color: theme.text }} className="text-sm font-medium">
                        {compact ? currentLanguage.toUpperCase() : currentLanguageInfo.name}
                    </Text>
                </View>

                {showDropdown ? (
                    <ChevronUp size={16} color={theme.textSecondary} />
                ) : (
                    <ChevronDown size={16} color={theme.textSecondary} />
                )}
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showDropdown && (
                <Animated.View
                    style={[
                        styles.dropdown,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
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
                        }
                    ]}
                    className={`absolute top-10 ${isRTL ? 'right-0' : 'left-0'} rounded-lg shadow-lg border z-50 min-w-44`}
                >
                    {languages.map((lang, index) => (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => selectLanguage(lang.code)}
                            style={{
                                backgroundColor: currentLanguage === lang.code
                                    ? theme.surface
                                    : 'transparent'
                            }}
                            className={`flex-row items-center px-4 py-3 ${
                                index === 0 ? 'rounded-t-lg' :
                                    index === languages.length - 1 ? 'rounded-b-lg' : ''
                            }`}
                            activeOpacity={0.7}
                        >
                            <Text className="text-lg mr-3">{lang.flag}</Text>
                            <View className="flex-1">
                                <Text style={{ color: theme.text }} className="text-sm font-medium">
                                    {lang.name}
                                </Text>
                                <Text style={{ color: theme.textSecondary }} className="text-xs">
                                    {lang.code.toUpperCase()}
                                </Text>
                            </View>
                            {currentLanguage === lang.code && (
                                <Text style={{ color: theme.primary }} className="text-sm">✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dropdown: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    }
});

export default LanguageDropdown;