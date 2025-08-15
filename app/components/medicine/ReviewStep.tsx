import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Check, Info, Edit3, Clock, Package, Utensils, Bell, BellOff, Pill, Calendar, Zap } from 'lucide-react-native';
import { MedicineForm, FrequencyType, FoodInstruction } from '@/app/services/medicine/medicine/MedicineServiceTypes';
import {medicines} from "@/assets/images";
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";

interface ReviewStepProps {
    formData: any;
    updateFormData: (updates: any) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
                                                   formData,
                                                   updateFormData,
                                               }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    // Generate smart defaults for preview
    const getSmartDefaults = () => {
        const defaults = {
            form: formData.form || MedicineForm.PILL,
            frequencyType: formData.frequencyType || FrequencyType.DAILY,
            intakeSchedules: formData.intakeSchedules.length > 0 ? formData.intakeSchedules : [{ time: '08:00', amount: 1 }],
            foodInstruction: formData.foodInstruction || FoodInstruction.DOES_NOT_MATTER,
            scheduleDuration: formData.scheduleDuration || 150,
            notificationsEnabled: formData.notificationsEnabled !== undefined ? formData.notificationsEnabled : true,
            missedDoseThresholdMinutes: formData.missedDoseThresholdMinutes !== undefined ? formData.missedDoseThresholdMinutes : 60,
            allowLateIntake: formData.allowLateIntake !== undefined ? formData.allowLateIntake : true,
            lateIntakeWindowHours: formData.lateIntakeWindowHours !== undefined ? formData.lateIntakeWindowHours : 4,
            autoDeductInventory: formData.autoDeductInventory !== undefined ? formData.autoDeductInventory : false,
            currentInventory: formData.currentInventory !== null ? formData.currentInventory : null,
            totalInventory: formData.totalInventory !== null ? formData.totalInventory : null,
            refillReminderThreshold: formData.refillReminderThreshold !== null ? formData.refillReminderThreshold : null,
        };

        return defaults;
    };

    const defaults = getSmartDefaults();

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatForm = (form: MedicineForm) => {
        return form.charAt(0) + form.slice(1).toLowerCase();
    };

    const formatFrequency = (freq: FrequencyType) => {
        switch (freq) {
            case FrequencyType.DAILY:
                return t('daily') || 'Daily';
            case FrequencyType.EVERY_OTHER_DAY:
                return t('everyOtherDay') || 'Every other day';
            case FrequencyType.SPECIFIC_DAYS_OF_WEEK:
                return t('specificDaysOfWeek') || 'Specific days of week';
            case FrequencyType.CYCLE_BASED:
                return t('cycleBasedDay') || 'Cycle based day';
            case FrequencyType.EVERY_X_DAYS:
                return t('everyXDay') || 'Every X day';
            case FrequencyType.EVERY_X_MONTHS:
                return t('everyXMonths') || 'Every X months';
            case FrequencyType.EVERY_X_WEEKS:
                return t('everyXWeek') || 'Every X Week';
            default:
                return t('daily') || 'Daily';
        }
    };

    const formatFoodInstruction = (instruction: FoodInstruction) => {
        switch (instruction) {
            case FoodInstruction.BEFORE_EATING:
                return t('takeBeforeEating') || 'Take before eating';
            case FoodInstruction.WHILE_EATING:
                return t('takeWithFood') || 'Take with food';
            case FoodInstruction.AFTER_EATING:
                return t('takeAfterEating') || 'Take after eating';
            case FoodInstruction.EMPTY_STOMACH:
                return t('takeOnEmptyStomach') || 'Take on empty stomach';
            case FoodInstruction.DOES_NOT_MATTER:
                return t('noFoodRestrictions') || 'No food restrictions';
            default:
                return t('noFoodRestrictions') || 'No food restrictions';
        }
    };

    const getTotalDailyDoses = () => {
        return defaults.intakeSchedules.reduce((total: number, schedule: any) => total + schedule.amount, 0);
    };

    // Format days of week for specific days schedule
    const formatSpecificDays = (days: string[]) => {
        if (!days || days.length === 0) return '';
        const formattedDays = days.map(day =>
            day.substring(0, 3).toUpperCase()
        );
        return formattedDays.join(', ');
    };

    // Format frequency with details
    const formatFrequencyDetails = () => {
        let details = formatFrequency(defaults.frequencyType);

        if (defaults.frequencyType === FrequencyType.SPECIFIC_DAYS_OF_WEEK &&
            formData.frequencyConfig?.specificDays?.length > 0) {
            details += ` (${formatSpecificDays(formData.frequencyConfig.specificDays)})`;
        } else if (defaults.frequencyType === FrequencyType.EVERY_OTHER_DAY) {
            details += ` (${t('everyTwoDays') || 'every 2 days'})`;
        } else if (defaults.frequencyType === FrequencyType.DAILY &&
            formData.frequencyConfig?.intervalDays > 1) {
            details += ` (${t('every') || 'every'} ${formData.frequencyConfig.intervalDays} ${t('days') || 'days'})`;
        }
        return details;
    };

    // Check what fields are using defaults
    const usingDefaults = {
        form: !formData.form,
        frequency: !formData.frequencyType,
        schedule: formData.intakeSchedules.length === 0,
        foodInstruction: !formData.foodInstruction,
        duration: !formData.scheduleDuration,
        notifications: formData.notificationsEnabled === undefined,
        missedDoseThreshold: formData.missedDoseThresholdMinutes === undefined,
        lateIntake: formData.allowLateIntake === undefined,
        lateIntakeWindow: formData.lateIntakeWindowHours === undefined,
        autoDeduct: formData.autoDeductInventory === undefined,
        currentInventory: formData.currentInventory === null,
        totalInventory: formData.totalInventory === null,
        refillReminder: formData.refillReminderThreshold === null,
    };

    const hasAnyDefaults = Object.values(usingDefaults).some(Boolean);

    const getImageKey = (form: MedicineForm): keyof typeof medicines | null => {
        const formMapping: Record<MedicineForm, keyof typeof medicines> = {
            [MedicineForm.PILL]: 'pill',
            [MedicineForm.CAPSULE]: 'capsule',
            [MedicineForm.TABLET]: 'pill',
            [MedicineForm.INJECTION]: 'injection',
            [MedicineForm.LIQUID]: 'liquid',
            [MedicineForm.DROPS]: 'liquid',
            [MedicineForm.INHALER]: 'inhaler',
            [MedicineForm.POWDER]: 'powder',
            [MedicineForm.PATCH]: 'patch',
            [MedicineForm.GEL]: 'gel',
            [MedicineForm.SPRAY]: 'spray',
            [MedicineForm.HARDCAPSULE]: 'hardcapsule',
            [MedicineForm.CREAM]: 'cream',
            [MedicineForm.GUMMYBEAR]: 'gummybear',
            [MedicineForm.OTHER]: 'pill',
        };

        return formMapping[form] || null;
    };

    const getMedicineImageSource = () => {
        if (!formData || !formData.form || !formData.icon) return null;

        const imageKey = getImageKey(formData.form);
        if (!imageKey || !medicines[imageKey]) return null;

        const medicineImages = medicines[imageKey] as Record<string, any>;
        return medicineImages[formData.icon] || null;
    };

    const medicineImageSource = getMedicineImageSource();

    return (
        <ScrollView className="flex-1 px-4">
            {/* Header */}
            <View className="mb-6">
                <Text style={{ color: theme.text }} className="text-2xl font-bold mb-2">
                    {t('reviewMedicine') || 'Review Medicine'}
                </Text>
                <Text style={{ color: theme.textSecondary }} className="text-base">
                    {t('reviewDescription') || 'Review your medicine details. Missing information will use smart defaults.'}
                </Text>
            </View>

            {/* Medicine Overview Card */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-6 rounded-xl border mb-6">
                <View className="flex-row items-center mb-4 -ml-5">
                    <Image
                        source={medicineImageSource}
                        className="w-20 h-20"
                        resizeMode="contain"
                    />
                    <View className="flex-1 ml-4">
                        <Text style={{ color: theme.text }} className="text-xl font-bold">
                            {formData.name}
                        </Text>
                        {formData.conditionReason && (
                            <Text style={{ color: theme.textSecondary }} className="text-sm">
                                {t('for') || 'For'} {formData.conditionReason}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Key Details */}
                <View className="space-y-3">
                    <View className="flex-row items-center pb-1">
                        <View style={{ backgroundColor: theme.surface }} className="p-2 rounded-3xl mr-3">
                            <Package size={16} color={theme.textSecondary} />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.text }} className="font-medium">
                                {formatForm(defaults.form)}
                                {usingDefaults.form && (
                                    <Text style={{ color: theme.warning }} className="text-sm font-normal">
                                        {' '}({t('default') || 'default'})
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center pb-1">
                        <View style={{ backgroundColor: theme.surface }} className="p-2 rounded-3xl mr-3">
                            <Clock size={16} color={theme.textSecondary} />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.text }} className="font-medium">
                                {formatFrequencyDetails()} - {getTotalDailyDoses()} {t('dose') || 'dose'}{getTotalDailyDoses() !== 1 ? 's' : ''} {t('perDay') || 'per day'}
                                {(usingDefaults.frequency || usingDefaults.schedule) && (
                                    <Text style={{ color: theme.warning }} className="text-sm font-normal">
                                        {' '}({t('default') || 'default'})
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center pb-1">
                        <View style={{ backgroundColor: theme.surface }} className="p-2 rounded-3xl mr-3">
                            <Utensils size={16} color={theme.textSecondary} />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.text }} className="font-medium">
                                {formatFoodInstruction(defaults.foodInstruction)}
                                {usingDefaults.foodInstruction && (
                                    <Text style={{ color: theme.warning }} className="text-sm font-normal">
                                        {' '}({t('default') || 'default'})
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Schedule Details */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                <Text style={{ color: theme.text }} className="text-lg font-semibold mb-4">
                    {t('dailySchedule') || 'Daily Schedule'}
                    {usingDefaults.schedule && (
                        <Text style={{ color: theme.warning }} className="text-sm font-normal">
                            {' '}({t('usingDefault') || 'using default'})
                        </Text>
                    )}
                </Text>

                <View className="space-y-2">
                    {defaults.intakeSchedules.map((schedule: any, index: number) => (
                        <View
                            key={index}
                            style={{ backgroundColor: theme.surface }}
                            className="flex-row items-center p-3 rounded-3xl mb-3"
                        >
                            <View style={{ backgroundColor: theme.primaryLight }} className="w-12 h-12 rounded-full items-center justify-center mr-3">
                                <Text style={{ color: theme.primaryDark }} className="font-bold">
                                    {schedule.amount}
                                </Text>
                            </View>

                            <View className="flex-1">
                                <Text style={{ color: theme.text }} className="font-medium">
                                    {formatTime(schedule.time)}
                                </Text>
                                <Text style={{ color: theme.textSecondary }} className="text-sm">
                                    {t('take') || 'Take'} {schedule.amount} {t('dose') || 'dose'}{schedule.amount !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Duration */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                <View className="flex-row items-center mb-2">
                    <Calendar size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.text }} className="text-lg font-semibold ml-3">
                        {t('duration') || 'Duration'}
                    </Text>
                </View>

                <Text style={{ color: theme.text }} className="ml-7">
                    {defaults.scheduleDuration
                        ? `${defaults.scheduleDuration} ${t('days') || 'days'}`
                        : (t('continueIndefinitely') || 'Continue indefinitely (no end date)')
                    }
                    {usingDefaults.duration && (
                        <Text style={{ color: theme.warning }} className="text-sm">
                            {' '}({t('default') || 'default'})
                        </Text>
                    )}
                </Text>
            </View>

            {/* Notification Settings */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                <View className="flex-row items-center mb-3">
                    {defaults.notificationsEnabled ? (
                        <Bell size={20} color={theme.textSecondary} />
                    ) : (
                        <BellOff size={20} color={theme.textSecondary} />
                    )}
                    <Text style={{ color: theme.text }} className="text-lg font-semibold ml-3">
                        {t('notificationSettings') || 'Notification Settings'}
                        {usingDefaults.notifications && (
                            <Text style={{ color: theme.warning }} className="text-sm font-normal">
                                {' '}({t('default') || 'default'})
                            </Text>
                        )}
                    </Text>
                </View>

                <View className="space-y-2 ml-7">
                    <View className="flex-row justify-between">
                        <Text style={{ color: theme.textSecondary }}>
                            {t('notifications') || 'Notifications'}:
                        </Text>
                        <Text style={{ color: theme.text }} className="font-medium">
                            {defaults.notificationsEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                        </Text>
                    </View>

                    {defaults.notificationsEnabled && (
                        <>
                            <View className="flex-row justify-between">
                                <Text style={{ color: theme.textSecondary }}>
                                    {t('missedDoseThreshold') || 'Missed dose threshold'}:
                                </Text>
                                <Text style={{ color: theme.text }} className="font-medium">
                                    {defaults.missedDoseThresholdMinutes} {t('minutes') || 'minutes'}
                                    {usingDefaults.missedDoseThreshold && (
                                        <Text style={{ color: theme.warning }} className="text-xs">
                                            {' '}({t('default') || 'default'})
                                        </Text>
                                    )}
                                </Text>
                            </View>

                            <View className="flex-row justify-between">
                                <Text style={{ color: theme.textSecondary }}>
                                    {t('allowLateIntake') || 'Allow late intake'}:
                                </Text>
                                <Text style={{ color: theme.text }} className="font-medium">
                                    {defaults.allowLateIntake ? (t('yes') || 'Yes') : (t('no') || 'No')}
                                    {usingDefaults.lateIntake && (
                                        <Text style={{ color: theme.warning }} className="text-xs">
                                            {' '}({t('default') || 'default'})
                                        </Text>
                                    )}
                                </Text>
                            </View>

                            {defaults.allowLateIntake && (
                                <View className="flex-row justify-between">
                                    <Text style={{ color: theme.textSecondary }}>
                                        {t('lateIntakeWindow') || 'Late intake window'}:
                                    </Text>
                                    <Text style={{ color: theme.text }} className="font-medium">
                                        {defaults.lateIntakeWindowHours} {t('hours') || 'hours'}
                                        {usingDefaults.lateIntakeWindow && (
                                            <Text style={{ color: theme.warning }} className="text-xs">
                                                {' '}({t('default') || 'default'})
                                            </Text>
                                        )}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>

            {/* Inventory Summary - Always shown with defaults */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                <View className="flex-row items-center mb-3">
                    <Pill size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.text }} className="text-lg font-semibold ml-3">
                        {t('inventoryTracking') || 'Inventory Tracking'}
                    </Text>
                </View>

                <View className="space-y-2 ml-7">
                    <View className="flex-row justify-between">
                        <Text style={{ color: theme.textSecondary }}>
                            {t('currentStock') || 'Current stock'}:
                        </Text>
                        <Text style={{ color: theme.text }} className="font-medium">
                            {defaults.currentInventory} {formData.form}
                            {usingDefaults.currentInventory && (
                                <Text style={{ color: theme.warning }} className="text-xs">
                                    {' '}({t('default') || 'default'})
                                </Text>
                            )}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text style={{ color: theme.textSecondary }}>
                            {t('fullBottle') || 'Full bottle'}:
                        </Text>
                        <Text style={{ color: theme.text }} className="font-medium">
                            {defaults.totalInventory} {formData.form}
                            {usingDefaults.totalInventory && (
                                <Text style={{ color: theme.warning }} className="text-xs">
                                    {' '}({t('default') || 'default'})
                                </Text>
                            )}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text style={{ color: theme.textSecondary }}>
                            {t('autoDeduct') || 'Auto-deduct'}:
                        </Text>
                        <Text style={{ color: theme.text }} className="font-medium">
                            {defaults.autoDeductInventory ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                            {usingDefaults.autoDeduct && (
                                <Text style={{ color: theme.warning }} className="text-xs">
                                    {' '}({t('default') || 'default'})
                                </Text>
                            )}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text style={{ color: theme.textSecondary }}>
                            {t('refillReminder') || 'Refill reminder'}:
                        </Text>
                        <Text style={{ color: theme.text }} className="font-medium">
                            {defaults.refillReminderThreshold} {formData.form}
                            {usingDefaults.refillReminder && (
                                <Text style={{ color: theme.warning }} className="text-xs">
                                    {' '}({t('default') || 'default'})
                                </Text>
                            )}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Smart Defaults Info */}
            {hasAnyDefaults && (
                <View style={{ backgroundColor: `${theme.warning}20` }} className="p-4 rounded-xl mb-6">
                    <View className="flex-row items-start">
                        <Info size={16} color={theme.warning} />
                        <View className="ml-3 flex-1">
                            <Text style={{ color: theme.warning }} className="text-sm font-medium mb-1">
                                {t('smartDefaultsApplied') || 'Smart Defaults Applied'}
                            </Text>
                            <Text style={{ color: theme.warning }} className="text-xs leading-relaxed">
                                {t('defaultsMessage') || 'Fields marked as (default) will use intelligent defaults since you didn\'t specify them. You can always change these settings later in the medicine details.'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Important Reminders */}
            <View style={{ backgroundColor: `${theme.primary}20` }} className="p-4 rounded-xl mb-6">
                <View className="flex-row items-start">
                    <Check size={16} color={theme.primary} />
                    <View className="ml-3 flex-1">
                        <Text style={{ color: theme.primary }} className="text-sm font-medium mb-1">
                            {t('readyToAddMedicine') || 'Ready to Add Medicine'}
                        </Text>
                        <Text style={{ color: theme.primary }} className="text-xs leading-relaxed">
                            {t('importantReminders') || '• Always follow your doctor\'s specific instructions\n• You can modify any setting after adding the medicine\n• Smart notifications will help you stay on track\n• Report any side effects to your healthcare provider'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Edit Actions */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-8">
                <Text style={{ color: theme.text }} className="text-lg font-semibold mb-3">
                    {t('needToMakeChanges') || 'Need to make changes?'}
                </Text>

                <Text style={{ color: theme.textSecondary }} className="text-sm mb-4">
                    {t('editActionsMessage') || 'Use the back button to modify any step, or add this medicine and customize it later from your medicine list.'}
                </Text>
            </View>
        </ScrollView>
    );
};

export default ReviewStep;