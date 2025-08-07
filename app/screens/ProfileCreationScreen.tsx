import React, { useState } from 'react';
import { View, SafeAreaView, Alert, Text } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { IconButton, PageIndicator } from '../components';
import { BasicInfoForm, GenderBirthForm, AllergyForm } from '../components/forms';
import { userService, UserStorageService, CreateUserRequest, ApiError } from '../services/user/UserService';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProfileCreationScreenProps = StackScreenProps<RootStackParamList, 'ProfileCreation'>;
type ProfileStep = 'basicInfo' | 'genderBirth' | 'allergies';

interface BasicInfo {
    firstName: string;
    lastName: string;
}

interface GenderBirthInfo {
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate: string;
}

const ProfileCreationScreen: React.FC<ProfileCreationScreenProps> = ({ navigation }) => {
    const { isDark } = useTheme();
    const { currentLanguage, isRTL, t } = useLanguage();

    const [currentStep, setCurrentStep] = useState<ProfileStep>('basicInfo');
    const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null);
    const [genderBirthInfo, setGenderBirthInfo] = useState<GenderBirthInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getLanguagePreference = (): 'ENGLISH' | 'ARABIC' | 'KURDISH' => {
        const languageMap = { 'ar': 'ARABIC', 'ku': 'KURDISH' } as const;
        return languageMap[currentLanguage as keyof typeof languageMap] || 'ENGLISH';
    };

    const handleApiError = (error: ApiError | any) => {
        console.error('Profile creation error:', error);

        const errorMessages = {
            'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
            'VALIDATION_ERROR': 'Please check your information and try again.',
            default: 'Failed to create profile. Please try again.'
        };

        const message = error.code ? errorMessages[error.code as keyof typeof errorMessages] || errorMessages.default
            : error.message || errorMessages.default;

        Alert.alert(t('error') || 'Error', message, [{ text: t('ok') || 'OK' }]);
    };

    const createProfile = async (profileData: CreateUserRequest) => {
        const createdUser = await userService.createUser(profileData);
        await UserStorageService.storeUser(createdUser);
        return createdUser;
    };

    const handleBasicInfoSubmit = (data: BasicInfo) => {
        setBasicInfo(data);
        setCurrentStep('genderBirth');
    };

    const handleGenderBirthSubmit = (data: GenderBirthInfo) => {
        setGenderBirthInfo(data);
        setCurrentStep('allergies');
    };

    const handleProfileComplete = async (allergies: Array<{ name: string; description: string }>) => {
        if (!basicInfo || !genderBirthInfo) return;

        setIsLoading(true);
        try {
            const profileData: CreateUserRequest = {
                ...basicInfo,
                ...genderBirthInfo,
                languagePreference: getLanguagePreference(),
                themePreference: isDark ? 'DARK' : 'LIGHT',
                allergies,
            };

            await createProfile(profileData);
            navigation.reset({ index: 0, routes: [{ name: "HomeTab" }] });
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const navigationHandlers = {
        basicInfo: () => navigation.goBack(),
        genderBirth: () => setCurrentStep('basicInfo'),
        allergies: () => setCurrentStep('genderBirth')
    };

    const stepConfig = {
        basicInfo: { number: 1, title: t('basicInfo') || 'Basic Information' },
        genderBirth: { number: 2, title: t('genderAndBirth') || 'Gender & Birth Date' },
        allergies: { number: 3, title: `${t('allergies') || 'Allergies'} (${t('optional') || 'Optional'})` }
    };

    const currentStepConfig = stepConfig[currentStep];

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            {/* Header */}
            <View className={`px-5 pt-4 pb-2 ${isRTL ? 'flex-row' : 'flex-row-reverse'} justify-between items-center`}>
                <IconButton
                    icon={isRTL ? '→' : '←'}
                    onPress={navigationHandlers[currentStep]}
                    size="large"
                />
                <View className="flex-1" />
            </View>

            {/* Step Info */}
            <View className="px-5 mb-6">
                <Text className={`text-sm font-medium text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {`${t('step') || 'Step'} ${currentStepConfig.number} ${t('of') || 'of'} 3: ${currentStepConfig.title}`}
                </Text>
            </View>

            {/* Forms */}
            <View className="flex-1">
                {currentStep === 'basicInfo' && <BasicInfoForm onSubmit={handleBasicInfoSubmit} />}
                {currentStep === 'genderBirth' && <GenderBirthForm onSubmit={handleGenderBirthSubmit} />}
                {currentStep === 'allergies' && (
                    <AllergyForm
                        onSubmit={handleProfileComplete}
                        onSkip={() => handleProfileComplete([])}
                    />
                )}
            </View>

            {/* Progress Indicator */}
            <View className="px-5 mb-6">
                <PageIndicator
                    totalPages={3}
                    currentPage={currentStep === 'basicInfo' ? 0 : currentStep === 'genderBirth' ? 1 : 2}
                    variant="pills"
                />
            </View>

            {/* Loading Overlay */}
            {isLoading && (
                <View
                    className="absolute inset-0 justify-center items-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                >
                    <View className={`p-8 rounded-2xl mx-8 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                        <View className="items-center">
                            <Text className="text-4xl mb-4">⏳</Text>
                            <Text className={`text-lg font-semibold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {t('creatingProfile') || 'Creating your profile...'}
                            </Text>
                            <Text className={`text-sm text-center ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('pleaseWait') || 'Please wait a moment'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default ProfileCreationScreen;