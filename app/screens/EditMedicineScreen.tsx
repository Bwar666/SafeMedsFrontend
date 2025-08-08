import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    BackHandler
} from 'react-native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { UserStorageService } from '../services/user/UserService';
import PageIndicator from '../components/PageIndicator';


// Import step components (reuse from AddMedicineScreen)
import BasicInfoStep from '../components/medicine/BasicInfoStep';
import ConditionStep from '../components/medicine/ConditionStep';
import FormStep from '../components/medicine/FormStep';
import FrequencyStep from '../components/medicine/FrequencyStep';
import DosageStep from '../components/medicine/DosageStep';
import DurationStep from '../components/medicine/DurationStep';
import FoodInstructionStep from '../components/medicine/FoodInstructionStep';
import InventoryStep from '../components/medicine/InventoryStep'; // NEW
import ReviewStep from '../components/medicine/ReviewStep';
import {MedicineResponse} from "@/app/services/medicine/usage/MedicineUsageTypes";
import {medicineService} from "@/app/services";
import {
    FoodInstruction,
    FrequencyConfig,
    FrequencyType,
    IntakeSchedule,
    MedicineForm, MedicineRequest
} from "@/app/services/medicine/medicine/MedicineServiceTypes";

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
    intakeTimes: string[];
    intakeSchedules: IntakeSchedule[];
    scheduleDuration: number;
    refillReminderThreshold: number;
    foodInstruction: FoodInstruction | null;
    icon: string;
    color: string;
    relatedAllergyIds: string[];

    // NEW: Add inventory fields
    currentInventory: number;
    totalInventory: number;
    inventoryUnit: string;
    autoDeductInventory: boolean;
    notificationsEnabled: boolean;
    missedDoseThresholdMinutes: number;
    allowLateIntake: boolean;
    lateIntakeWindowHours: number;
}

const TOTAL_STEPS = 9; // Updated from 8 to 9

const EditMedicineScreen: React.FC<EditMedicineScreenProps> = ({ navigation, route }) => {
    const { medicineId } = route.params;
    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    // Form data state with inventory fields
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

        // NEW: Add default inventory values
        currentInventory: 30,
        totalInventory: 30,
        inventoryUnit: 'pills',
        autoDeductInventory: true,
        notificationsEnabled: true,
        missedDoseThresholdMinutes: 60,
        allowLateIntake: true,
        lateIntakeWindowHours: 4,
    });

    // Hardware back button handler
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (currentStep > 0) {
                    // If not on first step, go back one step
                    prevStep();
                    return true; // Prevent default behavior
                } else {
                    // If on first step, show confirmation dialog
                    Alert.alert(
                        t('discardChanges') || 'Discard Changes?',
                        t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                        [
                            {
                                text: t('cancel') || 'Cancel',
                                style: 'cancel',
                            },
                            {
                                text: t('discard') || 'Discard',
                                style: 'destructive',
                                onPress: () => navigation.goBack(),
                            },
                        ]
                    );
                    return true; // Prevent default behavior
                }
            };

            // Add event listener
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            // Cleanup function
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

                // Populate form data with existing medicine data
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
                        dayOfMonth: 1,
                    },
                    intakeTimes: med.intakeTimes || ['08:00'],
                    intakeSchedules: med.intakeSchedules || [{ time: '08:00', amount: 1 }],
                    scheduleDuration: med.scheduleDuration || 30,
                    refillReminderThreshold: med.refillReminderThreshold || 7,
                    foodInstruction: med.foodInstruction || FoodInstruction.DOES_NOT_MATTER,
                    icon: med.icon || '💊',
                    color: med.color || '#6366F1',
                    relatedAllergyIds: med.relatedAllergies?.map(a => a.id) || [],

                    // NEW: Populate inventory fields (with fallbacks for compatibility)
                    currentInventory: med.currentInventory || 30,
                    totalInventory: med.totalInventory || 30,
                    inventoryUnit: med.inventoryUnit || 'pills',
                    autoDeductInventory: med.autoDeductInventory !== undefined ? med.autoDeductInventory : true,
                    notificationsEnabled: med.notificationsEnabled !== undefined ? med.notificationsEnabled : true,
                    missedDoseThresholdMinutes: med.missedDoseThresholdMinutes || 60,
                    allowLateIntake: med.allowLateIntake !== undefined ? med.allowLateIntake : true,
                    lateIntakeWindowHours: med.lateIntakeWindowHours || 4,
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
            case 7: // Inventory & Settings
                return formData.currentInventory >= 0 &&
                    formData.totalInventory >= formData.currentInventory &&
                    formData.missedDoseThresholdMinutes > 0 &&
                    formData.lateIntakeWindowHours > 0;
            case 8: // Review
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

    const handleBackPress = () => {
        if (currentStep > 0) {
            prevStep();
        } else {
            Alert.alert(
                t('discardChanges') || 'Discard Changes?',
                t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                [
                    {
                        text: t('cancel') || 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: t('discard') || 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.goBack(),
                    },
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

            // Prepare complete update request with all data
            const updateRequest: MedicineRequest = {
                name: formData.name.trim(),
                form: formData.form!,
                conditionReason: formData.conditionReason.trim(),
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

                // NEW: Add inventory fields
                currentInventory: formData.currentInventory,
                totalInventory: formData.totalInventory,
                inventoryUnit: formData.inventoryUnit,
                autoDeductInventory: formData.autoDeductInventory,
                notificationsEnabled: formData.notificationsEnabled,
                missedDoseThresholdMinutes: formData.missedDoseThresholdMinutes,
                allowLateIntake: formData.allowLateIntake,
                lateIntakeWindowHours: formData.lateIntakeWindowHours,
            };

            console.log('Updating medicine with:', updateRequest);

            // Update medicine
            await medicineService.updateMedicine(user.id, medicine.id, updateRequest);

            Alert.alert(
                t('success') || 'Success',
                t('medicineUpdatedSuccess') || 'Medicine has been updated successfully!',
                [
                    {
                        text: t('ok') || 'OK',
                        onPress: () => navigation.navigate('MedicineDetail', { medicineId: medicine.id }),
                    },
                ]
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
            t('duration') || 'Duration',
            t('foodInstruction') || 'Food Instruction',
            t('inventorySettings') || 'Inventory & Settings', // NEW
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
                return <InventoryStep {...stepProps} />; // NEW
            case 8:
                return <ReviewStep {...stepProps} />; // Moved to step 8
            default:
                return null;
        }
    };

    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const isFirstStep = currentStep === 0;

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
                <ActivityIndicator size="large" color={isDark ? '#6366F1' : '#4F46E5'} />
                <Text className={`mt-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {t('loadingMedicine') || 'Loading medicine details...'}
                </Text>
            </View>
        );
    }

    if (!medicine) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
                <Text className={`text-lg ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('medicineNotFound') || 'Medicine not found'}
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className={`mt-4 px-6 py-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                >
                    <Text className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {t('goBack') || 'Go Back'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                        onPress={handleBackPress}
                        className="p-2"
                        disabled={saving}
                    >
                        <ArrowLeft size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <Text className={`text-lg font-semibold text-center ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {t('editMedicine') || 'Edit Medicine'}
                        </Text>
                        <Text className={`text-sm text-center ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {getStepTitle(currentStep)} ({currentStep + 1}/{TOTAL_STEPS})
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                t('discardChanges') || 'Discard Changes?',
                                t('discardChangesDesc') || 'Are you sure you want to discard your changes and go back?',
                                [
                                    {
                                        text: t('cancel') || 'Cancel',
                                        style: 'cancel',
                                    },
                                    {
                                        text: t('discard') || 'Discard',
                                        style: 'destructive',
                                        onPress: () => navigation.goBack(),
                                    },
                                ]
                            );
                        }}
                        className="p-2"
                        disabled={saving}
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
                        disabled={isFirstStep || saving}
                        className={`px-6 py-3 rounded-xl ${
                            isFirstStep || saving
                                ? isDark ? 'bg-slate-700' : 'bg-gray-200'
                                : isDark ? 'bg-slate-700' : 'bg-gray-300'
                        }`}
                    >
                        <Text className={`font-medium ${
                            isFirstStep || saving
                                ? isDark ? 'text-slate-500' : 'text-gray-400'
                                : isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('previous') || 'Previous'}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-1 mx-4">
                        <View className={`h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <View
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={isLastStep ? handleSave : handleNext}
                        disabled={saving}
                        className={`flex-row items-center px-6 py-3 rounded-xl ${
                            saving ? 'bg-gray-400' : 'bg-indigo-500'
                        }`}
                    >
                        {isLastStep ? (
                            <>
                                <Check size={18} color="white" />
                                <Text className="text-white font-medium ml-2">
                                    {saving ? (t('saving') || 'Saving...') : (t('updateMedicine') || 'Update')}
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
        </SafeAreaView>
    );
};

export default EditMedicineScreen;