import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    Dimensions,
    Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface BasicInfoFormProps {
    onSubmit: (data: { firstName: string; lastName: string }) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ onSubmit }) => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
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

    const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

    const handleSubmit = () => {
        if (isValid) {
            Keyboard.dismiss();
            onSubmit({
                firstName: firstName.trim(),
                lastName: lastName.trim()
            });
        }
    };

    const inputClass = `p-4 rounded-xl border text-base ${
        isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
    }`;

    const labelClass = `text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`;

    const ValidationError = ({ show, message }: { show: boolean; message: string }) =>
        show ? <Text className="text-red-500 text-xs mt-1">{message}</Text> : null;

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
                        {t('createProfile') || 'Create Your Profile'}
                    </Text>
                    <Text className={`text-base text-center ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                        {t('tellUsYourName') || 'Let\'s start with your name'}
                    </Text>
                </View>

                {/* Content Container */}
                <View className="flex-1 justify-center">
                    {/* First Name */}
                    <View className="mb-6">
                        <Text className={labelClass}>
                            {t('firstName') || 'First Name'} *
                        </Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder={t('enterFirstName') || 'Enter your first name'}
                            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            className={inputClass}
                            textAlign={isRTL ? 'right' : 'left'}
                            autoFocus
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                        <ValidationError
                            show={firstName.length > 0 && firstName.trim().length < 2}
                            message={t('nameMinLength') || 'Name must be at least 2 characters'}
                        />
                    </View>

                    {/* Last Name */}
                    <View className="mb-8">
                        <Text className={labelClass}>
                            {t('lastName') || 'Last Name'} *
                        </Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder={t('enterLastName') || 'Enter your last name'}
                            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            className={inputClass}
                            textAlign={isRTL ? 'right' : 'left'}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            blurOnSubmit={false}
                        />
                        <ValidationError
                            show={lastName.length > 0 && lastName.trim().length < 2}
                            message={t('nameMinLength') || 'Name must be at least 2 characters'}
                        />
                    </View>
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
        </View>
    );
};

export default BasicInfoForm;