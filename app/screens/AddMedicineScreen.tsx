import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import PageIndicator from '../components/PageIndicator';
import { UserStorageService } from '../services/user/UserService';
import {
    medicineService,
    MedicineRequest,
    MedicineForm,
    FrequencyType,
    FoodInstruction,
    DayOfWeek,
    IntakeSchedule,
    FrequencyConfig
} from '../services/medicine/MedicineService';

// Import step components
import BasicInfoStep from '../components/medicine/BasicInfoStep';
import ConditionStep from '../components/medicine/ConditionStep';
import FormStep from '../components/medicine/FormStep';
import FrequencyStep from '../components/medicine/FrequencyStep';
import DosageStep from '../components/medicine/DosageStep';
import DurationStep from '../components/medicine/DurationStep';
import FoodInstructionStep from '../components/medicine/FoodInstructionStep';
import ReviewStep from '../components/medicine/ReviewStep';

// Types
interface AddMedicineScreenProps {
    navigation: StackNavigationProp<any>;
    route?: RouteProp<any, any>;
}

interface FormData {
    name: string;
    conditionReason: string;
    form: MedicineForm | null;
    frequencyType: FrequencyType | null;
    frequencyConfig: FrequencyConfig;
    intakeTimes: string[];
    intakeSchedules: IntakeSchedule[];
    scheduleDuration: number;
    refillReminderThreshold: number;
    foodInstruction: FoodInstruction | null;
    icon: string;
    color: string;
    relatedAllergyIds: string[];
}

const TOTAL_STEPS = 8;

const AddMedicineScreen: React.FC<AddMedicineScreenProps> = ({ navigation, route }) => {
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form data state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        conditionReason: '',
        form: null,
        frequencyType: null,
        frequencyConfig: {
            intervalDays: 1,
            specificDays: [],
            cycleActiveDays: 0,
            cycleRestDays: 0,
            dayOfMonth: 1,
        },
        intakeTimes: ['08:00'],
        intakeSchedules: [{ time: '08:00', amount: 1 }],
        scheduleDuration: 7,
        refillReminderThreshold: 5,
        foodInstruction: null,
        icon: '💊',
        color: '#6366F1',
        relatedAllergyIds: [],
    });

    // Load user ID on mount
    useEffect(() => {
        loadUserId();
    }, []);

    const loadUserId = async () => {
        try {
            const storedUserId = await UserStorageService.getStoredUserId();
            if (storedUserId) {
                setUserId(storedUserId);
            } else {
                // Fallback: try to get from stored user
                const user = await UserStorageService.getStoredUser();
                if (user) {
                    setUserId(user.id);
                } else {
                    Alert.alert(
                        t('error') || 'Error',
                        t('userNotFound') || 'User information not found. Please restart the app.',
                        [{ text: t('ok') || 'OK', onPress: () => navigation.goBack() }]
                    );
                }
            }
        } catch (error) {
            console.error('Error loading user ID:', error);
            Alert.alert(
                t('error') || 'Error',
                t('userLoadError') || 'Failed to load user information.',
                [{ text: t('ok') || 'OK', onPress: () => navigation.goBack() }]
            );
        }
    };

    const updateFormData = useCallback((updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 0: // Basic Info
                return formData.name.trim().length > 0;
            case 1: // Condition
                return formData.conditionReason.trim().length > 0;
            case 2: // Form
                return formData.form !== null;
            case 3: // Frequency
                return formData.frequencyType !== null;
            case 4: // Dosage
                return formData.intakeSchedules.length > 0 &&
                    formData.intakeSchedules.every(schedule =>
                        schedule.time && schedule.amount > 0
                    );
            case 5: // Duration
                return formData.scheduleDuration > 0;
            case 6: // Food Instruction
                return formData.foodInstruction !== null;
            case 7: // Review
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            nextStep();
        } else {
            Alert.alert(
                t('incompleteStep') || 'Incomplete Step',
                t('pleaseCompleteStep') || 'Please complete all required fields before continuing.',
                [{ text: t('ok') || 'OK' }]
            );
        }
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) {
            Alert.alert(
                t('incompleteForm') || 'Incomplete Form',
                t('pleaseCompleteAllSteps') || 'Please complete all required fields.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        if (!userId) {
            Alert.alert(
                t('error') || 'Error',
                t('userNotFound') || 'User information not found.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const medicineRequest: MedicineRequest = {
                name: formData.name,
                form: formData.form!,
                conditionReason: formData.conditionReason,
                frequencyType: formData.frequencyType!,
                frequencyConfig: formData.frequencyConfig,
                intakeTimes: formData.intakeTimes,
                intakeSchedules: formData.intakeSchedules,
                scheduleDuration: formData.scheduleDuration,
                refillReminderThreshold: formData.refillReminderThreshold,
                foodInstruction: formData.foodInstruction!,
                icon: formData.icon,
                color: formData.color,
                relatedAllergyIds: formData.relatedAllergyIds,
            };

            await medicineService.createMedicine(userId, medicineRequest);

            Alert.alert(
                t('success') || 'Success',
                t('medicineAddedSuccess') || 'Medicine has been added successfully!',
                [
                    {
                        text: t('ok') || 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding medicine:', error);
            Alert.alert(
                t('error') || 'Error',
                t('medicineAddError') || 'Failed to add medicine. Please try again.',
                [{ text: t('ok') || 'OK' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepTitle = (step: number): string => {
        const titles = [
            t('basicInfo') || 'Basic Info',
            t('condition') || 'Condition',
            t('medicineForm') || 'Medicine Form',
            t('frequency') || 'Frequency',
            t('dosage') || 'Dosage',
            t('duration') || 'Duration',
            t('foodInstruction') || 'Food Instruction',
            t('review') || 'Review',
        ];
        return titles[step] || '';
    };

    const renderStep = () => {
        const stepProps = {
            formData,
            updateFormData,
            isDark,
            t: t as (key: string) => string,
            isRTL,
        };

        switch (currentStep) {
            case 0:
                return <BasicInfoStep {...stepProps} />;
            case 1:
                return <ConditionStep {...stepProps} />;
            case 2:
                return <FormStep {...stepProps} />;
            case 3:
                return <FrequencyStep {...stepProps} />;
            case 4:
                return <DosageStep {...stepProps} />;
            case 5:
                return <DurationStep {...stepProps} />;
            case 6:
                return <FoodInstructionStep {...stepProps} />;
            case 7:
                return <ReviewStep {...stepProps} />;
            default:
                return null;
        }
    };

    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const isFirstStep = currentStep === 0;

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {/* Header */}
                <View className={`flex-row items-center justify-between p-4 border-b ${
                    isDark ? 'border-slate-700' : 'border-gray-200'
                }`}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                        disabled={isSubmitting}
                    >
                        <ArrowLeft size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <Text className={`text-lg font-semibold text-center ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {t('addMedicine') || 'Add Medicine'}
                        </Text>
                        <Text className={`text-sm text-center ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {getStepTitle(currentStep)} ({currentStep + 1}/{TOTAL_STEPS})
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                        disabled={isSubmitting}
                    >
                        <X size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                    </TouchableOpacity>
                </View>

                {/* Progress Indicator */}
                <View className="py-4">
                    <PageIndicator
                        totalPages={TOTAL_STEPS}
                        currentPage={currentStep}
                        variant="progress"
                    />
                </View>

                {/* Step Content */}
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStep()}
                </ScrollView>

                {/* Navigation Buttons */}
                <View className={`flex-row items-center justify-between p-4 border-t ${
                    isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
                }`}>
                    <TouchableOpacity
                        onPress={prevStep}
                        disabled={isFirstStep || isSubmitting}
                        className={`px-6 py-3 rounded-xl ${
                            isFirstStep || isSubmitting
                                ? isDark ? 'bg-slate-700' : 'bg-gray-200'
                                : isDark ? 'bg-slate-600' : 'bg-gray-300'
                        }`}
                    >
                        <Text className={`font-semibold ${
                            isFirstStep || isSubmitting
                                ? isDark ? 'text-slate-500' : 'text-gray-400'
                                : isDark ? 'text-slate-100' : 'text-gray-700'
                        }`}>
                            {t('back') || 'Back'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={isLastStep ? handleSubmit : handleNext}
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-xl ${
                            isSubmitting
                                ? isDark ? 'bg-slate-600' : 'bg-gray-400'
                                : 'bg-indigo-500'
                        }`}
                    >
                        {isSubmitting ? (
                            <Text className="text-white font-semibold">
                                {t('submitting') || 'Submitting...'}
                            </Text>
                        ) : (
                            <View className="flex-row items-center">
                                {isLastStep && (
                                    <Check size={16} color="white" style={{ marginRight: 8 }} />
                                )}
                                <Text className="text-white font-semibold">
                                    {isLastStep
                                        ? (t('addMedicine') || 'Add Medicine')
                                        : (t('next') || 'Next')
                                    }
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddMedicineScreen;