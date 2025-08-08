import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Edit, AlertTriangle, CheckCircle } from 'lucide-react-native';
import {FoodInstruction, FrequencyType, MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";

interface FormData {
    name: string;
    conditionReason: string;
    form: MedicineForm | null;
    frequencyType: FrequencyType | null;
    intakeSchedules: Array<{ time: string; amount: number }>;
    scheduleDuration: number;
    refillReminderThreshold: number;
    foodInstruction: FoodInstruction | null;
    icon: string;
    color: string;
}

interface ReviewStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string; // Changed from strict typing to generic string
    isRTL: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
                                                   formData,
                                                   updateFormData,
                                                   isDark,
                                                   t,
                                                   isRTL,
                                               }) => {
    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const formatDuration = (days: number) => {
        if (days === 365) return t('ongoing') || 'Ongoing';
        if (days >= 30) {
            const months = Math.floor(days / 30);
            return `${months} ${months === 1 ? 'month' : 'months'}`;
        }
        if (days >= 7) {
            const weeks = Math.floor(days / 7);
            const remainingDays = days % 7;
            if (remainingDays === 0) {
                return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
            }
            return `${weeks}w ${remainingDays}d`;
        }
        return `${days} ${days === 1 ? 'day' : 'days'}`;
    };

    const getFormDisplayName = (form: MedicineForm) => {
        const formNames = {
            [MedicineForm.PILL]: t('pill') || 'Pill',
            [MedicineForm.CAPSULE]: t('capsule') || 'Capsule',
            [MedicineForm.TABLET]: t('tablet') || 'Tablet',
            [MedicineForm.INJECTION]: t('injection') || 'Injection',
            [MedicineForm.LIQUID]: t('liquid') || 'Liquid',
            [MedicineForm.DROPS]: t('drops') || 'Drops',
            [MedicineForm.INHALER]: t('inhaler') || 'Inhaler',
            [MedicineForm.POWDER]: t('powder') || 'Powder',
            [MedicineForm.PATCH]: t('patch') || 'Patch',
            [MedicineForm.GEL]: t('gel') || 'Gel',
            [MedicineForm.SPRAY]: t('spray') || 'Spray',
            [MedicineForm.OTHER]: t('other') || 'Other',
        };
        return formNames[form] || form;
    };

    const getFrequencyDisplayName = (frequency: FrequencyType) => {
        const frequencyNames = {
            [FrequencyType.DAILY]: t('daily') || 'Daily',
            [FrequencyType.EVERY_OTHER_DAY]: t('everyOtherDay') || 'Every Other Day',
            [FrequencyType.SPECIFIC_DAYS_OF_WEEK]: t('specificDays') || 'Specific Days',
            [FrequencyType.EVERY_X_DAYS]: t('everyXDays') || 'Every X Days',
            [FrequencyType.EVERY_X_WEEKS]: t('everyXWeeks') || 'Every X Weeks',
            [FrequencyType.EVERY_X_MONTHS]: t('everyXMonths') || 'Every X Months',
            [FrequencyType.CYCLE_BASED]: t('cycleBased') || 'Cycle Based',
        };
        return frequencyNames[frequency] || frequency;
    };

    const getFoodInstructionDisplayName = (instruction: FoodInstruction) => {
        const instructionNames = {
            [FoodInstruction.BEFORE_EATING]: t('beforeEating') || 'Before Eating',
            [FoodInstruction.WHILE_EATING]: t('whileEating') || 'With Food',
            [FoodInstruction.AFTER_EATING]: t('afterEating') || 'After Eating',
            [FoodInstruction.EMPTY_STOMACH]: t('emptyStomach') || 'Empty Stomach',
            [FoodInstruction.DOES_NOT_MATTER]: t('doesNotMatter') || 'Anytime',
        };
        return instructionNames[instruction] || instruction;
    };

    const totalDailyAmount = formData.intakeSchedules.reduce((sum, schedule) => sum + schedule.amount, 0);

    const ReviewSection: React.FC<{
        title: string;
        icon: string;
        children: React.ReactNode;
        onEdit?: () => void;
    }> = ({ title, icon, children, onEdit }) => (
        <View className={`p-4 rounded-xl mb-4 ${
            isDark ? 'bg-slate-800' : 'bg-white'
        } shadow-sm`}>
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                    <Text className="text-xl mr-2">{icon}</Text>
                    <Text className={`font-semibold ${
                        isDark ? 'text-slate-100' : 'text-gray-800'
                    }`}>
                        {title}
                    </Text>
                </View>
                {onEdit && (
                    <TouchableOpacity onPress={onEdit} className="p-1">
                        <Edit size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                    </TouchableOpacity>
                )}
            </View>
            {children}
        </View>
    );

    const InfoRow: React.FC<{
        label: string;
        value: string;
        highlight?: boolean;
    }> = ({ label, value, highlight = false }) => (
        <View className="flex-row justify-between items-center py-1">
            <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {label}:
            </Text>
            <Text className={`font-medium ${
                highlight
                    ? 'text-indigo-500'
                    : isDark ? 'text-slate-100' : 'text-gray-800'
            }`}>
                {value}
            </Text>
        </View>
    );

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('reviewMedicine') || 'Review Medicine'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('reviewDescription') || 'Please review all details before adding'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Medicine Overview */}
                <View className={`p-6 rounded-xl mb-6 ${
                    isDark ? 'bg-slate-800 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'
                }`}>
                    <View className="items-center">
                        <Text className="text-4xl mb-2">{formData.icon}</Text>
                        <Text className={`text-xl font-bold text-center ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {formData.name}
                        </Text>
                        <Text className={`text-sm text-center mt-1 ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {t('for') || 'For'} {formData.conditionReason}
                        </Text>
                    </View>
                </View>

                {/* Basic Information */}
                <ReviewSection title={t('basicInformation') || 'Basic Information'} icon="📋">
                    <InfoRow label={t('medicineName') || 'Medicine'} value={formData.name} highlight />
                    <InfoRow label={t('condition') || 'Condition'} value={formData.conditionReason} />
                    <InfoRow label={t('form') || 'Form'} value={formData.form ? getFormDisplayName(formData.form) : 'Not set'} />
                </ReviewSection>

                {/* Schedule Information */}
                <ReviewSection title={t('scheduleInformation') || 'Schedule Information'} icon="⏰">
                    <InfoRow
                        label={t('frequency') || 'Frequency'}
                        value={formData.frequencyType ? getFrequencyDisplayName(formData.frequencyType) : 'Not set'}
                    />
                    <InfoRow
                        label={t('timesPerDay') || 'Times per day'}
                        value={formData.intakeSchedules.length.toString()}
                        highlight
                    />
                    <InfoRow
                        label={t('totalDailyAmount') || 'Total daily amount'}
                        value={totalDailyAmount.toString()}
                    />

                    {/* Individual Intake Times */}
                    <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('intakeTimes') || 'Intake Times'}:
                        </Text>
                        {formData.intakeSchedules.map((schedule, index) => (
                            <View key={index} className="flex-row justify-between items-center py-1">
                                <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {formatTime(schedule.time)}
                                </Text>
                                <Text className={`font-medium ${
                                    isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {schedule.amount} {schedule.amount === 1 ? 'dose' : 'doses'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ReviewSection>

                {/* Duration & Reminders */}
                <ReviewSection title={t('durationReminders') || 'Duration & Reminders'} icon="📅">
                    <InfoRow
                        label={t('treatmentDuration') || 'Duration'}
                        value={formatDuration(formData.scheduleDuration)}
                        highlight
                    />
                    <InfoRow
                        label={t('refillReminder') || 'Refill reminder'}
                        value={`${formData.refillReminderThreshold} ${formData.refillReminderThreshold === 1 ? 'day' : 'days'} before`}
                    />
                    {formData.scheduleDuration < 365 && (
                        <InfoRow
                            label={t('estimatedEndDate') || 'Estimated end'}
                            value={new Date(Date.now() + formData.scheduleDuration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        />
                    )}
                </ReviewSection>

                {/* Food Instructions */}
                <ReviewSection title={t('foodInstructions') || 'Food Instructions'} icon="🍽️">
                    <InfoRow
                        label={t('takeWith') || 'Take with'}
                        value={formData.foodInstruction ? getFoodInstructionDisplayName(formData.foodInstruction) : 'Not set'}
                        highlight
                    />
                </ReviewSection>

                {/* Warnings & Alerts */}
                <View className={`p-4 rounded-xl mb-6 ${
                    isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                }`}>
                    <View className="flex-row items-start">
                        <AlertTriangle size={20} color="#F59E0B" style={{ marginRight: 12, marginTop: 2 }} />
                        <View className="flex-1">
                            <Text className={`font-semibold mb-2 ${
                                isDark ? 'text-amber-300' : 'text-amber-800'
                            }`}>
                                {t('importantReminders') || 'Important Reminders'}
                            </Text>
                            <View className="space-y-1">
                                <Text className={`text-sm ${
                                    isDark ? 'text-amber-300' : 'text-amber-700'
                                }`}>
                                    • {t('reminder1') || 'Always follow your doctor\'s instructions'}
                                </Text>
                                <Text className={`text-sm ${
                                    isDark ? 'text-amber-300' : 'text-amber-700'
                                }`}>
                                    • {t('reminder2') || 'Don\'t stop taking without consulting your doctor'}
                                </Text>
                                <Text className={`text-sm ${
                                    isDark ? 'text-amber-300' : 'text-amber-700'
                                }`}>
                                    • {t('reminder3') || 'Report any side effects immediately'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Confirmation */}
                <View className={`p-4 rounded-xl ${
                    isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                }`}>
                    <View className="flex-row items-center">
                        <CheckCircle size={20} color="#10B981" style={{ marginRight: 12 }} />
                        <Text className={`font-semibold ${
                            isDark ? 'text-green-300' : 'text-green-800'
                        }`}>
                            {t('readyToAdd') || 'Ready to add this medicine to your tracking'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default ReviewStep;