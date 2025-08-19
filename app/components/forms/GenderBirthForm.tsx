import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    Dimensions,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface GenderBirthFormProps {
    onSubmit: (data: { gender: Gender; birthDate: string }) => void;
}

const GenderBirthForm: React.FC<GenderBirthFormProps> = ({ onSubmit }) => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
    const [birthDate, setBirthDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showManualInput, setShowManualInput] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [screenHeight] = useState(Dimensions.get('window').height);

    useEffect(() => {
        const keyboardWillShow = (e: any) => {
            setKeyboardHeight(e.endCoordinates.height);
        };

        const keyboardWillHide = () => {
            setKeyboardHeight(0);
        };

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
        const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);

        return () => {
            showSubscription?.remove();
            hideSubscription?.remove();
        };
    }, []);

    const formatDate = (text: string): string => {
        const numbers = text.replace(/\D/g, '');
        if (numbers.length <= 4) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
        return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
    };

    const isValidDate = (dateString: string): boolean => {
        if (dateString.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

        const date = new Date(dateString);
        const [year, month, day] = dateString.split('-').map(Number);

        return date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            year >= 1900 &&
            year <= new Date().getFullYear();
    };

    const handleDateChange = (text: string) => setBirthDate(formatDate(text));

    // Handle native date picker change
    const handleNativeDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setSelectedDate(selectedDate);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setBirthDate(formattedDate);
        }
    };

    // Handle iOS date picker confirmation
    const handleIOSDateConfirm = () => {
        setShowDatePicker(false);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setBirthDate(formattedDate);
    };

    const isValid = selectedGender !== null && isValidDate(birthDate);

    const handleSubmit = () => {
        if (isValid && selectedGender) {
            Keyboard.dismiss();
            onSubmit({ gender: selectedGender, birthDate });
        }
    };

    const genderOptions = [
        { value: 'MALE' as Gender, label: t('male') || 'Male', icon: '👨' },
        { value: 'FEMALE' as Gender, label: t('female') || 'Female', icon: '👩' },
        { value: 'OTHER' as Gender, label: t('other') || 'Other', icon: '👤' },
    ];

    // Get maximum date (today)
    const maxDate = new Date();

    // Get minimum date (120 years ago)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);

    return (
        <View
            className="flex-1"
            style={{
                marginBottom: keyboardHeight > 0 ? keyboardHeight - 80 : 0,
                maxHeight: keyboardHeight > 0 ? screenHeight - keyboardHeight - 120 : screenHeight
            }}
        >
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View className="mb-8">
                    <Text className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {t('genderAndBirth') || 'Gender & Birth Date'}
                    </Text>
                    <Text className={`text-base text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                        {t('genderBirthDescription') || 'Tell us your gender and when you were born'}
                    </Text>
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

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className={`p-4 rounded-xl border text-base mb-3 ${
                            isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
                        }`}
                        activeOpacity={0.7}
                    >
                        <Text className={`${
                            birthDate
                                ? (isDark ? 'text-slate-100' : 'text-gray-800')
                                : (isDark ? 'text-slate-400' : 'text-gray-400')
                        } ${isRTL ? 'text-right' : 'text-left'}`}>
                            {birthDate || 'YYYY-MM-DD'}
                        </Text>
                    </TouchableOpacity>
                    <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {t('birthDateFormat') || 'Format: YYYY-MM-DD (e.g., 1990-05-15)'}
                    </Text>

                    {birthDate.length > 0 && !isValidDate(birthDate) && (
                        <Text className="text-red-500 text-xs mt-1">
                            {t('invalidDate') || 'Please enter a valid date'}
                        </Text>
                    )}
                </View>

                {/* Submit Button */}
                <View className="pb-6">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!isValid}
                        className={`py-4 rounded-xl items-center ${
                            isValid ? 'bg-indigo-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'
                        }`}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-lg font-semibold ${
                            isValid ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {t('continue') || 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Native Date Picker */}
            {showDatePicker && (
                <View>
                    {Platform.OS === 'ios' && (
                        <View
                            className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-slate-800' : 'bg-white'} border-t`}
                            style={{ paddingBottom: 34 }} // Safe area for iPhone
                        >
                            {/* iOS Header */}
                            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {t('cancel') || 'Cancel'}
                                    </Text>
                                </TouchableOpacity>
                                <Text className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                    {t('selectBirthDate') || 'Select Birth Date'}
                                </Text>
                                <TouchableOpacity onPress={handleIOSDateConfirm}>
                                    <Text className="text-lg text-indigo-500 font-semibold">
                                        {t('done') || 'Done'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* iOS Date Picker */}
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="spinner"
                                onChange={handleNativeDateChange}
                                maximumDate={maxDate}
                                minimumDate={minDate}
                                style={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}
                            />
                        </View>
                    )}

                    {Platform.OS === 'android' && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={handleNativeDateChange}
                            maximumDate={maxDate}
                            minimumDate={minDate}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

export default GenderBirthForm;