import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    BackHandler
} from 'react-native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import PageIndicator from '../../components/PageIndicator';
import MedicineCreationLoading from '../../components/medicine/MedicineCreationLoading';

// Import step components
import BasicInfoStep from '../../components/medicine/BasicInfoStep';
import ConditionStep from '../../components/medicine/ConditionStep';
import FormStep from '../../components/medicine/FormStep';
import FrequencyStep from '../../components/medicine/FrequencyStep';
import DosageStep from '../../components/medicine/DosageStep';
import DurationStep from '../../components/medicine/DurationStep';
import FoodInstructionStep from '../../components/medicine/FoodInstructionStep';
import InventoryStep from '../../components/medicine/InventoryStep';
import ReviewStep from '../../components/medicine/ReviewStep';
import {
    FoodInstruction, FrequencyConfig, FrequencyType,
    IntakeSchedule,
    MedicineForm,
    MedicineRequest
} from "@/app/services/medicine/medicine/MedicineServiceTypes";
import { medicineService } from "@/app/services";
import {UserStorageService} from "@/app/services/user";

// Types
interface AddMedicineScreenProps {
    navigation: StackNavigationProp<any>;
    route?: RouteProp<any, any>;
}

// Use the flexible form data interface
interface FlexibleFormData {
    name: string;
    conditionReason: string;
    form: MedicineForm | null;
    frequencyType: FrequencyType | null;
    frequencyConfig: FrequencyConfig;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration: number | null ;
    refillReminderThreshold: number | null;
    foodInstruction: FoodInstruction | null;
    icon: string;
    currentInventory: number | null;
    totalInventory: number | null;
    autoDeductInventory: boolean;
    notificationsEnabled: boolean;
    missedDoseThresholdMinutes: number | null;
    allowLateIntake: boolean;
}

// Base props interface for all steps
interface BaseStepProps {
    formData: FlexibleFormData;
    updateFormData: (updates: Partial<FlexibleFormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

// Define which steps are required vs optional
const STEP_CONFIG = [
    { key: 'basicInfo', title: 'Basic Info', required: true, canSkip: false },
    { key: 'condition', title: 'Condition', required: true, canSkip: false },
    { key: 'form', title: 'Medicine Form', required: true, canSkip: false },
    { key: 'frequency', title: 'Frequency', required: true, canSkip: false },
    { key: 'dosage', title: 'Dosage', required: true, canSkip: false },
    { key: 'foodInstruction', title: 'Food Instruction', required: false, canSkip: true },
    { key: 'duration', title: 'Duration', required: false, canSkip: true },
    { key: 'inventory', title: 'Inventory (Optional)', required: false, canSkip: true },
    { key: 'review', title: 'Review', required: true, canSkip: false },
];

const TOTAL_STEPS = STEP_CONFIG.length;

const AddMedicineScreen: React.FC<AddMedicineScreenProps> = ({ navigation, route }) => {
    const { isDark, theme } = useTheme();
    const { t, isRTL } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState<'creating' | 'analyzing' | 'generating_warnings' | 'finalizing'>('creating');

    // Form data state with better defaults
    const [formData, setFormData] = useState<FlexibleFormData>({
        name: '',
        conditionReason: '',
        form: null,
        frequencyType: null,
        frequencyConfig: {
            intervalDays: 1,
            specificDays: [],
            cycleActiveDays: 0,
            cycleRestDays: 0,
        },
        intakeSchedules: [],
        scheduleDuration: null,
        refillReminderThreshold: null,
        foodInstruction: null,
        icon: '',
        currentInventory: null,
        totalInventory: null,
        autoDeductInventory: false,
        notificationsEnabled: true,
        missedDoseThresholdMinutes: 60,
        allowLateIntake: true,
    });

    useEffect(() => {
        loadUserId();
    }, []);

    const loadUserId = async () => {
        try {
            const user = await UserStorageService.getStoredUser();
            if (user?.id) {
                setUserId(user.id);
            } else {
                Alert.alert(
                    t('error') || 'Error',
                    t('userNotFound') || 'User information not found. Please restart the app.',
                    [{ text: t('ok') || 'OK', onPress: () => navigation.goBack() }]
                );
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

    // Hardware back button handler
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (currentStep > 0) {
                    prevStep();
                    return true;
                } else {
                    Alert.alert(
                        t('discardChanges') || 'Discard Changes?',
                        t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                        [
                            { text: t('cancel') || 'Cancel', style: 'cancel' },
                            { text: t('discard') || 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                        ]
                    );
                    return true;
                }
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [currentStep, navigation, t])
    );

    const updateFormData = useCallback((updates: Partial<FlexibleFormData>) => {
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

    const skipStep = useCallback(() => {
        const step = STEP_CONFIG[currentStep];
        if (step.canSkip && currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep]);

    // Validate required fields for each step
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 0: return formData.name.trim().length > 0;
            case 1: return formData.conditionReason.trim().length > 0;
            case 2: return formData.form !== null;
            case 3: return formData.frequencyType !== null;
            case 4: return formData.intakeSchedules.length > 0 &&
                formData.intakeSchedules.every(schedule => schedule.time && schedule.amount > 0);
            case 8: return true;
            default: return true;
        }
    };

    // Generate smart defaults when user skips steps
    const generateSmartDefaults = (data: FlexibleFormData): MedicineRequest => {
        return {
            name: data.name,
            form: data.form || MedicineForm.PILL,
            conditionReason: data.conditionReason || undefined,
            frequencyType: data.frequencyType || FrequencyType.DAILY,
            frequencyConfig: data.frequencyConfig,
            intakeSchedules: data.intakeSchedules.length > 0 ? data.intakeSchedules : [{ time: '08:00', amount: 1 }],
            scheduleDuration: data.scheduleDuration || undefined,
            refillReminderThreshold: data.currentInventory !== null ? (data.refillReminderThreshold || 5) : undefined,
            foodInstruction: data.foodInstruction || FoodInstruction.DOES_NOT_MATTER,
            icon: data.icon || undefined,
            currentInventory: data.currentInventory || undefined,
            totalInventory: data.totalInventory || undefined,
            autoDeductInventory: data.currentInventory !== null ? data.autoDeductInventory : false,
            notificationsEnabled: data.notificationsEnabled,
            missedDoseThresholdMinutes: data.missedDoseThresholdMinutes || undefined,
            allowLateIntake: data.allowLateIntake,
        };
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            nextStep();
        } else {
            const step = STEP_CONFIG[currentStep];
            let errorMessage = t('pleaseCompleteStep') || 'Please complete all required fields before continuing.';
            switch (step.key) {
                case 'basicInfo':
                    errorMessage = t('medicineNameRequired') || 'Medicine name is required';
                    break;
                case 'condition':
                    errorMessage = t('conditionReasonRequired') || 'Condition/reason is required';
                    break;
                case 'form':
                    errorMessage = t('medicineFormRequired') || 'Medicine form is required';
                    break;
                case 'frequency':
                    errorMessage = t('frequencyConfigurationInvalid') || 'Invalid frequency configuration';
                    break;
                case 'dosage':
                    if (formData.intakeSchedules.length === 0) {
                        errorMessage = t('atLeastOneDosageRequired') || 'At least one dosage time is required';
                    } else {
                        errorMessage = t('dosageTimeAmountRequired') || 'All dosage times must have a valid time and amount';
                    }
                    break;
            }
            Alert.alert(
                t('incompleteStep') || 'Incomplete Step',
                errorMessage,
                [{ text: t('ok') || 'OK' }]
            );
        }
    };

    const handleSubmit = async () => {
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
            setLoadingStep('creating');
            const medicineRequest = generateSmartDefaults(formData);
            await medicineService.createMedicine(userId, medicineRequest);

            setLoadingStep('analyzing');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setLoadingStep('generating_warnings');
            await new Promise(resolve => setTimeout(resolve, 2000));

            setLoadingStep('finalizing');
            await new Promise(resolve => setTimeout(resolve, 800));

            Alert.alert(
                t('success') || 'Success',
                t('medicineAddedWithWarnings') || 'Medicine has been added successfully! AI safety warnings have been generated for your protection.',
                [{
                    text: t('ok') || 'OK',
                    onPress: () => navigation.goBack(),
                }]
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

    const renderStep = () => {
        const stepProps: BaseStepProps = {
            formData,
            updateFormData,
            isDark,
            t: t as (key: string) => string,
            isRTL,
        };

        const step = STEP_CONFIG[currentStep];
        switch (step.key) {
            case 'basicInfo': return <BasicInfoStep {...stepProps} />;
            case 'condition': return <ConditionStep {...stepProps} />;
            case 'form': return <FormStep {...stepProps} />;
            case 'frequency': return <FrequencyStep {...stepProps} />;
            case 'dosage': return <DosageStep {...stepProps} allowCustomTimes={true} />;
            case 'duration': return <DurationStep {...stepProps} />;
            case 'foodInstruction': return <FoodInstructionStep {...stepProps} />;
            case 'inventory': return <InventoryStep {...stepProps} />;
            case 'review': return <ReviewStep {...stepProps} />;
            default: return null;
        }
    };

    const currentStepConfig = STEP_CONFIG[currentStep];
    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const isFirstStep = currentStep === 0;

    return (
        <SafeAreaView className={`flex-1`} style={{ backgroundColor: theme.background }}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {/* Header */}
                <View className={`flex-row items-center justify-between p-4 border-b`}
                      style={{ borderBottomColor: theme.border, backgroundColor: theme.card }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <Text className={`text-lg font-semibold text-center`}
                              style={{ color: theme.text }}>
                            {currentStepConfig.title}
                        </Text>
                        <Text className={`text-sm text-center`}
                              style={{ color: theme.textSecondary }}>
                            Step {currentStep + 1} of {TOTAL_STEPS}
                            {currentStepConfig.canSkip && ' (Optional)'}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -mr-2">
                        <X size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Step Content */}
                <ScrollView className="flex-1">
                    {renderStep()}
                </ScrollView>

                {/* Navigation Buttons */}
                <View className={`flex-row items-center justify-between p-4 border-t`}
                      style={{ borderTopColor: theme.border, backgroundColor: theme.card }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={prevStep}
                        disabled={isFirstStep || isSubmitting}
                        className={`px-6 py-3 rounded-xl`}
                        style={{ backgroundColor: isFirstStep || isSubmitting ? theme.border : theme.surface }}
                    >
                        <Text className={`font-medium`}
                              style={{ color: isFirstStep || isSubmitting ? theme.textSecondary : theme.text }}>
                            {t('back') || 'Back'}
                        </Text>
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View className="flex-1 mx-4">
                        <View className={`h-1 rounded-full`} style={{ backgroundColor: theme.border }}>
                            <View
                                className="h-full rounded-full"
                                style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`, backgroundColor: theme.primary }}
                            />
                        </View>
                    </View>

                    {/* Skip/Next/Submit Buttons */}
                    <View className="flex-row space-x-3">
                        {/* Skip Button */}
                        {currentStepConfig.canSkip && !isLastStep && (
                            <TouchableOpacity
                                onPress={skipStep}
                                disabled={isSubmitting}
                                className={`px-4 py-3 rounded-xl border`}
                                style={{ borderColor: theme.border, backgroundColor: 'transparent' }}
                            >
                                <Text className={`font-medium text-sm`}
                                      style={{ color: theme.textSecondary }}>
                                    {t('skip') || 'Skip'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Next/Submit Button */}
                        <TouchableOpacity
                            onPress={isLastStep ? handleSubmit : handleNext}
                            disabled={isSubmitting}
                            className={`flex-row items-center px-6 py-3 rounded-xl`}
                            style={{ backgroundColor: isSubmitting ? theme.border : theme.primary }}
                        >
                            {isLastStep ? (
                                <>
                                    <Check size={18} color="white" />
                                    <Text className="text-white font-medium ml-2">
                                        {isSubmitting ? (t('submitting') || 'Adding...') : (t('addMedicine') || 'Add Medicine')}
                                    </Text>
                                </>
                            ) : (
                                <Text className="text-white font-medium">
                                    {t('next') || 'Next'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Loading Dialog */}
            <MedicineCreationLoading
                visible={isSubmitting}
                currentStep={loadingStep}
                medicineName={formData.name}
            />
        </SafeAreaView>
    );
};

export default AddMedicineScreen;