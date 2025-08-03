import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Backend enum mappings
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface UserInfoFormProps {
    onSubmit: (data: { firstName: string; lastName: string; gender: Gender; birthDate: string }) => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ onSubmit }) => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
    const [birthDate, setBirthDate] = useState('');

    // Validation
    const isValid = firstName.trim() && lastName.trim() && selectedGender && birthDate;

    const handleSubmit = () => {
        if (isValid) {
            onSubmit({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                gender: selectedGender!,
                birthDate
            });
        }
    };

    const genderOptions = [
        { value: 'MALE' as Gender, label: t('male') || 'Male', icon: '👨' },
        { value: 'FEMALE' as Gender, label: t('female') || 'Female', icon: '👩' },
        { value: 'OTHER' as Gender, label: t('other') || 'Other', icon: '👤' },
    ];

    return (
        <ScrollView className="flex-1 px-5">
            {/* Header */}
            <View className="mb-8">
                <Text className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('createProfile') || 'Create Your Profile'}
                </Text>
                <Text className={`text-base text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    {t('profileDescription') || 'Tell us about yourself to personalize your medicine tracking'}
                </Text>
            </View>

            {/* First Name */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {t('firstName') || 'First Name'} *
                </Text>
                <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder={t('enterFirstName') || 'Enter your first name'}
                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                    className={`p-4 rounded-xl border text-base ${
                        isDark
                            ? 'bg-slate-800 border-slate-600 text-slate-100'
                            : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    textAlign={isRTL ? 'right' : 'left'}
                />
            </View>

            {/* Last Name */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {t('lastName') || 'Last Name'} *
                </Text>
                <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder={t('enterLastName') || 'Enter your last name'}
                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                    className={`p-4 rounded-xl border text-base ${
                        isDark
                            ? 'bg-slate-800 border-slate-600 text-slate-100'
                            : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    textAlign={isRTL ? 'right' : 'left'}
                />
            </View>

            {/* Gender Selection */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {t('gender') || 'Gender'} *
                </Text>
                <View className="gap-3">
                    {genderOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setSelectedGender(option.value)}
                            className={`flex-row items-center p-4 rounded-xl border ${
                                selectedGender === option.value
                                    ? 'border-indigo-500 border-2'
                                    : isDark ? 'border-slate-600' : 'border-gray-300'
                            } ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                            activeOpacity={0.7}
                        >
                            <Text className="text-xl mr-3">{option.icon}</Text>
                            <Text className={`text-base font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {option.label}
                            </Text>
                            {selectedGender === option.value && (
                                <View className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                                    <Text className="text-indigo-500 text-lg">✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Birth Date */}
            <View className="mb-8">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {t('birthDate') || 'Birth Date'} *
                </Text>
                <TextInput
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                    className={`p-4 rounded-xl border text-base ${
                        isDark
                            ? 'bg-slate-800 border-slate-600 text-slate-100'
                            : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    textAlign={isRTL ? 'right' : 'left'}
                    keyboardType="numeric"
                />
                <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('birthDateFormat') || 'Format: YYYY-MM-DD (e.g., 1990-05-15)'}
                </Text>
            </View>
            {/* Submit Button */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={!isValid}
                className={`py-4 rounded-xl items-center mb-6 ${
                    isValid
                        ? 'bg-indigo-500'
                        : isDark ? 'bg-slate-700' : 'bg-gray-300'
                }`}
                activeOpacity={0.8}
            >
                <Text className={`text-lg font-semibold ${
                    isValid ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                    {t('continue') || 'Continue'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default UserInfoForm;