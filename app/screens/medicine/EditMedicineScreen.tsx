import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
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
import { RootStackParamList } from '../../navigation/AppNavigator';

// Import step components
import BasicInfoStep from '../../components/medicine/BasicInfoStep';
import ConditionStep from '../../components/medicine/ConditionStep';
import FormStep from '../../components/medicine/FormStep';
import FrequencyStep from '../../components/medicine/FrequencyStep';
import DosageStep from '../../components/medicine/DosageStep';
import FoodInstructionStep from '../../components/medicine/FoodInstructionStep';
import DurationStep from '../../components/medicine/DurationStep';
import InventoryStep from '../../components/medicine/InventoryStep';
import ReviewStep from '../../components/medicine/ReviewStep';
import { MedicineResponse } from "@/app/services/medicine/usage/MedicineUsageTypes";
import { medicineService } from "@/app/services";
import {
    FoodInstruction,
    FrequencyConfig,
    FrequencyType,
    IntakeSchedule,
    MedicineForm,
    MedicineRequest
} from "@/app/services/medicine/medicine/MedicineServiceTypes";
import { UserStorageService } from "@/app/services/user";
import MedicineCreationLoading from "@/app/components/medicine/MedicineCreationLoading";

// Types
type EditMedicineScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditMedicine'>;
type EditMedicineScreenRouteProp = RouteProp<RootStackParamList, 'EditMedicine'>;

interface EditMedicineScreenProps {
    navigation: EditMedicineScreenNavigationProp;
    route: EditMedicineScreenRouteProp;
}

interface FormData {
    name: string;
    conditionReason: string;
    form: MedicineForm | null;
    frequencyType: FrequencyType | null;
    frequencyConfig: FrequencyConfig;
    intakeSchedules: IntakeSchedule[];
    scheduleDuration: number | null;
    refillReminderThreshold: number | null;
    foodInstruction: FoodInstruction | null;
    icon: string;
    color: string;
    currentInventory: number | null;
    totalInventory: number | null;
    autoDeductInventory: boolean;
    notificationsEnabled: boolean;
    missedDoseThresholdMinutes: number;
    allowLateIntake: boolean;
}

const TOTAL_STEPS = 9;

const EditMedicineScreen: React.FC<EditMedicineScreenProps> = ({ navigation, route }) => {
    const { medicineId } = route.params;
    const { isDark, theme } = useTheme();
    const { t, isRTL } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loadingStep, setLoadingStep] = useState<'creating' | 'analyzing' | 'generating_warnings' | 'finalizing'>('creating');

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
        },
        intakeSchedules: [{ time: '08:00', amount: 1 }],
        scheduleDuration: 0,
        refillReminderThreshold: null,
        foodInstruction: null,
        icon: '💊',
        color: '#6366F1',
        currentInventory: null,
        totalInventory: null,
        autoDeductInventory: false,
        notificationsEnabled: true,
        missedDoseThresholdMinutes: 60,
        allowLateIntake: true,
    });

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
        }, [currentStep])
    );

    // Load medicine and populate form data
    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const user = await UserStorageService.getStoredUser();
                if (!user) throw new Error('User not found');

                const med = await medicineService.getMedicineById(user.id, medicineId);
                setMedicine(med);

                // Populate form data
                setFormData({
                    name: med.name || '',
                    conditionReason: med.conditionReason || '',
                    form: med.form || MedicineForm.PILL,
                    frequencyType: med.frequencyType || FrequencyType.DAILY,
                    frequencyConfig: med.frequencyConfig || {
                        intervalDays: 1,
                        specificDays: [],
                        cycleActiveDays: 0,
                        cycleRestDays: 0,
                    },
                    intakeSchedules: med.intakeSchedules || [{ time: '08:00', amount: 1 }],
                    scheduleDuration: med.scheduleDuration || 0,
                    refillReminderThreshold: med.refillReminderThreshold || null,
                    foodInstruction: med.foodInstruction || FoodInstruction.DOES_NOT_MATTER,
                    icon: med.icon || '💊',
                    color: med.color || '#6366F1',
                    currentInventory: med.currentInventory || null,
                    totalInventory: med.totalInventory || null,
                    autoDeductInventory: med.autoDeductInventory !== undefined ? med.autoDeductInventory : false,
                    notificationsEnabled: med.notificationsEnabled !== undefined ? med.notificationsEnabled : true,
                    missedDoseThresholdMinutes: med.missedDoseThresholdMinutes || 60,
                    allowLateIntake: med.allowLateIntake !== undefined ? med.allowLateIntake : true,
                });
            } catch (error) {
                console.error('Error fetching medicine:', error);
                Alert.alert(t('error') || 'Error', t('fetchError') || 'Failed to load medicine details');
            } finally {
                setLoading(false);
            }
        };

        fetchMedicine();
    }, [medicineId]);

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

    const getStepErrorMessage = (step: number): string => {
        switch (step) {
            case 0:
                return t('medicineNameRequired') || 'Medicine name is required';
            case 1:
                return t('conditionReasonRequired') || 'Condition/reason is required';
            case 2:
                return t('medicineFormRequired') || 'Medicine form is required';
            case 3:
                return t('frequencyConfigurationInvalid') || 'Invalid frequency configuration';
            case 4:
                if (formData.intakeSchedules.length === 0) {
                    return t('atLeastOneDosageRequired') || 'At least one dosage time is required';
                } else {
                    return t('dosageTimeAmountRequired') || 'All dosage times must have a valid time and amount';
                }
            case 5:
                return t('foodInstructionRequired') || 'Food instruction is required';
            case 6:
                return t('durationRequired') || 'Duration is required';
            case 7:
                return t('inventorySettingsRequired') || 'Please check inventory settings';
            default:
                return t('pleaseCompleteStep') || 'Please complete all required fields before continuing.';
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            nextStep();
        } else {
            const errorMessage = getStepErrorMessage(currentStep);
            Alert.alert(
                t('incompleteStep') || 'Incomplete Step',
                errorMessage,
                [{ text: t('ok') || 'OK' }]
            );
        }
    };

    const handleBackPress = () => {
        if (currentStep > 0) {
            prevStep();
        } else {
            Alert.alert(
                t('discardChanges') || 'Discard Changes?',
                t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                [
                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                    { text: t('discard') || 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                ]
            );
        }
    };

    const handleSave = async () => {
        if (!validateCurrentStep()) {
            Alert.alert(
                t('incompleteForm') || 'Incomplete Form',
                t('pleaseCompleteAllSteps') || 'Please complete all required fields.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        if (!medicine) return;

        setSaving(true);
        try {
            const user = await UserStorageService.getStoredUser();
            if (!user) throw new Error('User not found');

            // Start the loading sequence
            setLoadingStep('creating');

            // Prepare update request
            const updateRequest: MedicineRequest = {
                name: formData.name.trim(),
                form: formData.form!,
                conditionReason: formData.conditionReason.trim(),
                frequencyType: formData.frequencyType!,
                frequencyConfig: formData.frequencyConfig,
                intakeSchedules: formData.intakeSchedules,
                scheduleDuration: formData.scheduleDuration!,
                refillReminderThreshold: formData.refillReminderThreshold!,
                foodInstruction: formData.foodInstruction!,
                icon: formData.icon,
                color: formData.color,
                currentInventory: formData.currentInventory!,
                totalInventory: formData.totalInventory!,
                autoDeductInventory: formData.autoDeductInventory,
                notificationsEnabled: formData.notificationsEnabled,
                missedDoseThresholdMinutes: formData.missedDoseThresholdMinutes,
                allowLateIntake: formData.allowLateIntake,
            };

            // Simulate the loading steps like in AddMedicineScreen
            await new Promise(resolve => setTimeout(resolve, 1000));

            setLoadingStep('analyzing');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setLoadingStep('generating_warnings');
            await new Promise(resolve => setTimeout(resolve, 2000));

            setLoadingStep('finalizing');

            // Update medicine
            await medicineService.updateMedicine(user.id, medicine.id, updateRequest);

            await new Promise(resolve => setTimeout(resolve, 800));

            Alert.alert(
                t('success') || 'Success',
                t('medicineUpdatedSuccess') || 'Medicine has been updated successfully! Updated safety warnings have been generated.',
                [{
                    text: t('ok') || 'OK',
                    onPress: () => navigation.goBack()
                }]
            );
        } catch (error) {
            console.error('Error updating medicine:', error);
            Alert.alert(
                t('error') || 'Error',
                t('updateError') || 'Failed to update medicine. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    const getStepTitle = (step: number): string => {
        const titles = [
            t('basicInfo') || 'Basic Info',
            t('condition') || 'Condition',
            t('medicineForm') || 'Medicine Form',
            t('frequency') || 'Frequency',
            t('dosage') || 'Dosage',
            t('foodInstruction') || 'Food Instruction',
            t('duration') || 'Duration',
            t('inventorySettings') || 'Inventory & Settings',
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
            case 0: return <BasicInfoStep {...stepProps} />;
            case 1: return <ConditionStep {...stepProps} />;
            case 2: return <FormStep {...stepProps} />;
            case 3: return <FrequencyStep {...stepProps} />;
            case 4: return <DosageStep {...stepProps} />;
            case 5: return <FoodInstructionStep {...stepProps} />;
            case 6: return <DurationStep {...stepProps} />;
            case 7: return <InventoryStep {...stepProps} />;
            case 8: return <ReviewStep {...stepProps} />;
            default: return null;
        }
    };

    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const isFirstStep = currentStep === 0;

    // Show loading screen while fetching medicine data
    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text className="text-lg mt-4" style={{ color: theme.text }}>
                        {t('loadingMedicine') || 'Loading medicine details...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state if medicine not found
    if (!medicine) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
                <View className="flex-1 justify-center items-center px-4">
                    <Text className="text-lg text-center mb-4" style={{ color: theme.text }}>
                        {t('medicineNotFound') || 'Medicine not found'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="px-6 py-3 rounded-lg"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text className="font-medium" style={{ color: theme.text }}>
                            {t('goBack') || 'Go Back'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b"
                      style={{ borderBottomColor: theme.border, backgroundColor: theme.card }}>
                    <TouchableOpacity
                        onPress={handleBackPress}
                        className="p-2"
                        disabled={saving}
                    >
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <Text className="text-lg font-semibold text-center"
                              style={{ color: theme.text }}>
                            {t('editMedicine') || 'Edit Medicine'}
                        </Text>
                        <Text className="text-sm text-center"
                              style={{ color: theme.textSecondary }}>
                            {getStepTitle(currentStep)} ({currentStep + 1}/{TOTAL_STEPS})
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                t('discardChanges') || 'Discard Changes?',
                                t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                                [
                                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                                    { text: t('discard') || 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                                ]
                            );
                        }}
                        className="p-2"
                        disabled={saving}
                    >
                        <X size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Step Content */}
                <View className="flex-1">
                    {renderStep()}
                </View>

                {/* Navigation Buttons */}
                <View className="flex-row items-center justify-between p-4 border-t"
                      style={{ borderTopColor: theme.border, backgroundColor: theme.card }}>
                    <TouchableOpacity
                        onPress={prevStep}
                        disabled={isFirstStep || saving}
                        className="px-6 py-3 rounded-xl"
                        style={{ backgroundColor: isFirstStep || saving ? theme.border : theme.surface }}
                    >
                        <Text className="font-medium"
                              style={{ color: isFirstStep || saving ? theme.textSecondary : theme.text }}>
                            {t('previous') || 'Previous'}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <View className="h-1 rounded-full" style={{ backgroundColor: theme.border }}>
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`,
                                    backgroundColor: theme.primary
                                }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={isLastStep ? handleSave : handleNext}
                        disabled={saving}
                        className="flex-row items-center px-6 py-3 rounded-xl"
                        style={{ backgroundColor: saving ? theme.border : theme.primary }}
                    >
                        {isLastStep ? (
                            <>
                                <Check size={18} color="white" />
                                <Text className="text-white font-medium ml-2">
                                    {saving ? (t('updating') || 'Updating...') : (t('updateMedicine') || 'Update')}
                                </Text>
                            </>
                        ) : (
                            <Text className="text-white font-medium">
                                {t('next') || 'Next'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Loading Dialog - Outside KeyboardAvoidingView */}
            <MedicineCreationLoading
                visible={saving}
                currentStep={loadingStep}
                medicineName={formData.name}
            />
        </SafeAreaView>
    );
};

export default EditMedicineScreen;