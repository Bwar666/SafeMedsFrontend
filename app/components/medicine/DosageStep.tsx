import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Plus, Minus, Clock } from 'lucide-react-native';
import { IntakeSchedule } from '../../services/medicine/MedicineService';

interface FormData {
    intakeTimes: string[];
    intakeSchedules: IntakeSchedule[];
    [key: string]: any;
}

interface DosageStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const DosageStep: React.FC<DosageStepProps> = ({
                                                   formData,
                                                   updateFormData,
                                                   isDark,
                                                   t,
                                                   isRTL,
                                               }) => {
    const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(null);

    const commonTimes = [
        { label: t('morning') || 'Morning', time: '08:00', icon: '🌅' },
        { label: t('afternoon') || 'Afternoon', time: '14:00', icon: '☀️' },
        { label: t('evening') || 'Evening', time: '18:00', icon: '🌆' },
        { label: t('night') || 'Night', time: '22:00', icon: '🌙' },
    ];

    const addIntakeTime = () => {
        const newTime = '12:00';
        const newSchedule: IntakeSchedule = { time: newTime, amount: 1 };

        updateFormData({
            intakeTimes: [...formData.intakeTimes, newTime],
            intakeSchedules: [...formData.intakeSchedules, newSchedule]
        });
    };

    const removeIntakeTime = (index: number) => {
        if (formData.intakeSchedules.length === 1) {
            Alert.alert(
                t('cannotRemove') || 'Cannot Remove',
                t('atLeastOneIntake') || 'You must have at least one intake time.',
                [{ text: t('ok') || 'OK' }]
            );
            return;
        }

        const newIntakeTimes = formData.intakeTimes.filter((_, i) => i !== index);
        const newSchedules = formData.intakeSchedules.filter((_, i) => i !== index);

        updateFormData({
            intakeTimes: newIntakeTimes,
            intakeSchedules: newSchedules
        });
    };

    const updateIntakeTime = (index: number, time: string) => {
        const newIntakeTimes = [...formData.intakeTimes];
        const newSchedules = [...formData.intakeSchedules];

        newIntakeTimes[index] = time;
        newSchedules[index] = { ...newSchedules[index], time };

        updateFormData({
            intakeTimes: newIntakeTimes,
            intakeSchedules: newSchedules
        });
    };

    const updateIntakeAmount = (index: number, amount: string) => {
        const numAmount = parseFloat(amount) || 0;
        const newSchedules = [...formData.intakeSchedules];
        newSchedules[index] = { ...newSchedules[index], amount: numAmount };

        updateFormData({ intakeSchedules: newSchedules });
    };

    const selectCommonTime = (time: string) => {
        if (selectedTimeIndex !== null) {
            updateIntakeTime(selectedTimeIndex, time);
            setSelectedTimeIndex(null);
        } else {
            // Add new time
            const newSchedule: IntakeSchedule = { time, amount: 1 };
            updateFormData({
                intakeTimes: [...formData.intakeTimes, time],
                intakeSchedules: [...formData.intakeSchedules, newSchedule]
            });
        }
    };

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

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('dosageAndTiming') || 'Dosage & Timing'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('dosageDescription') || 'When and how much do you take?'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Current Intake Schedule */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-3 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        {t('intakeSchedule') || 'Intake Schedule'}
                    </Text>

                    {formData.intakeSchedules.map((schedule, index) => (
                        <View
                            key={index}
                            className={`flex-row items-center p-4 rounded-xl mb-3 ${
                                isDark ? 'bg-slate-800' : 'bg-gray-50'
                            }`}
                        >
                            <Clock size={20} color={isDark ? '#94A3B8' : '#6B7280'} />

                            <TouchableOpacity
                                onPress={() => setSelectedTimeIndex(selectedTimeIndex === index ? null : index)}
                                className={`ml-3 px-3 py-2 rounded-lg border ${
                                    selectedTimeIndex === index
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : isDark ? 'border-slate-600' : 'border-gray-300'
                                }`}
                            >
                                <Text className={`font-medium ${
                                    selectedTimeIndex === index
                                        ? 'text-indigo-500'
                                        : isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {formatTime(schedule.time)}
                                </Text>
                            </TouchableOpacity>

                            <View className="flex-row items-center ml-auto">
                                <Text className={`mr-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    Amount:
                                </Text>
                                <TextInput
                                    value={schedule.amount.toString()}
                                    onChangeText={(value) => updateIntakeAmount(index, value)}
                                    className={`w-16 px-2 py-1 rounded border text-center ${
                                        isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    keyboardType="decimal-pad"
                                />

                                <TouchableOpacity
                                    onPress={() => removeIntakeTime(index)}
                                    className="ml-3 p-2"
                                    disabled={formData.intakeSchedules.length === 1}
                                >
                                    <Minus
                                        size={16}
                                        color={formData.intakeSchedules.length === 1 ? '#9CA3AF' : '#EF4444'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Add New Time Button */}
                    <TouchableOpacity
                        onPress={addIntakeTime}
                        className={`flex-row items-center justify-center p-3 rounded-xl border-2 border-dashed ${
                            isDark ? 'border-slate-600' : 'border-gray-300'
                        }`}
                        activeOpacity={0.7}
                    >
                        <Plus size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                        <Text className={`ml-2 font-medium ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('addIntakeTime') || 'Add Intake Time'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Common Times Quick Select */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-3 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        {t('commonTimes') || 'Common Times'}
                        {selectedTimeIndex !== null && (
                            <Text className={`text-xs ml-2 ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                ({t('selectToUpdate') || 'Select to update selected time'})
                            </Text>
                        )}
                    </Text>

                    <View className="flex-row flex-wrap gap-3">
                        {commonTimes.map((timeOption) => (
                            <TouchableOpacity
                                key={timeOption.time}
                                onPress={() => selectCommonTime(timeOption.time)}
                                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                                    formData.intakeTimes.includes(timeOption.time)
                                        ? 'border-green-500 bg-green-500/10'
                                        : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className="text-lg mr-2">{timeOption.icon}</Text>
                                <View>
                                    <Text className={`font-medium ${
                                        formData.intakeTimes.includes(timeOption.time)
                                            ? 'text-green-500'
                                            : isDark ? 'text-slate-200' : 'text-gray-700'
                                    }`}>
                                        {timeOption.label}
                                    </Text>
                                    <Text className={`text-xs ${
                                        isDark ? 'text-slate-400' : 'text-gray-500'
                                    }`}>
                                        {formatTime(timeOption.time)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Summary */}
                <View className={`p-4 rounded-xl ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                    <Text className={`font-semibold mb-2 ${
                        isDark ? 'text-slate-100' : 'text-gray-800'
                    }`}>
                        {t('dosageSummary') || 'Dosage Summary'}
                    </Text>
                    <Text className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                        {formData.intakeSchedules.length} {formData.intakeSchedules.length === 1 ? 'time' : 'times'} per day
                    </Text>
                    <Text className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                        Total daily amount: {formData.intakeSchedules.reduce((sum, schedule) => sum + schedule.amount, 0)}
                    </Text>
                </View>
            </ScrollView>

            {/* Help Text */}
            <View className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>
                    💡 {t('dosageTip') || 'Tip: Set exact times and amounts as prescribed by your doctor'}
                </Text>
            </View>
        </View>
    );
};

export default DosageStep;