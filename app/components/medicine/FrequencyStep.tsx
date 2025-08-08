import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import {DayOfWeek, FrequencyConfig, FrequencyType} from "@/app/services/medicine/medicine/MedicineServiceTypes";

interface FormData {
    frequencyType: FrequencyType | null;
    frequencyConfig: FrequencyConfig;
    [key: string]: any;
}

interface FrequencyStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string; // Changed from strict typing to generic string
    isRTL: boolean;
}

const FrequencyStep: React.FC<FrequencyStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                         isDark,
                                                         t,
                                                         isRTL,
                                                     }) => {
    const frequencyOptions = [
        {
            value: FrequencyType.DAILY,
            label: t('daily') || 'Daily',
            icon: '📅',
            description: 'Every day'
        },
        {
            value: FrequencyType.EVERY_OTHER_DAY,
            label: t('everyOtherDay') || 'Every Other Day',
            icon: '📆',
            description: 'Every 2 days'
        },
        {
            value: FrequencyType.SPECIFIC_DAYS_OF_WEEK,
            label: t('specificDays') || 'Specific Days',
            icon: '🗓️',
            description: 'Choose specific days'
        },
        {
            value: FrequencyType.EVERY_X_DAYS,
            label: t('everyXDays') || 'Every X Days',
            icon: '⏰',
            description: 'Custom interval'
        },
        {
            value: FrequencyType.EVERY_X_WEEKS,
            label: t('everyXWeeks') || 'Every X Weeks',
            icon: '📋',
            description: 'Weekly interval'
        },
        {
            value: FrequencyType.EVERY_X_MONTHS,
            label: t('everyXMonths') || 'Every X Months',
            icon: '🗓️',
            description: 'Monthly interval'
        },
        {
            value: FrequencyType.CYCLE_BASED,
            label: t('cycleBased') || 'Cycle Based',
            icon: '🔄',
            description: 'X days on, Y days off'
        },
    ];

    const daysOfWeek = [
        { value: DayOfWeek.MONDAY, label: t('monday') || 'Mon', fullLabel: 'Monday' },
        { value: DayOfWeek.TUESDAY, label: t('tuesday') || 'Tue', fullLabel: 'Tuesday' },
        { value: DayOfWeek.WEDNESDAY, label: t('wednesday') || 'Wed', fullLabel: 'Wednesday' },
        { value: DayOfWeek.THURSDAY, label: t('thursday') || 'Thu', fullLabel: 'Thursday' },
        { value: DayOfWeek.FRIDAY, label: t('friday') || 'Fri', fullLabel: 'Friday' },
        { value: DayOfWeek.SATURDAY, label: t('saturday') || 'Sat', fullLabel: 'Saturday' },
        { value: DayOfWeek.SUNDAY, label: t('sunday') || 'Sun', fullLabel: 'Sunday' },
    ];

    const selectFrequency = (frequencyType: FrequencyType) => {
        const newConfig: FrequencyConfig = {
            intervalDays: 1,
            specificDays: [],
            cycleActiveDays: 0,
            cycleRestDays: 0,
            dayOfMonth: 1,
        };

        updateFormData({
            frequencyType,
            frequencyConfig: newConfig
        });
    };

    const toggleDay = (day: DayOfWeek) => {
        const currentDays = formData.frequencyConfig.specificDays || [];
        const updatedDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];

        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                specificDays: updatedDays
            }
        });
    };

    const updateIntervalDays = (days: string) => {
        const intervalDays = parseInt(days) || 1;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                intervalDays
            }
        });
    };

    const updateCycleConfig = (field: 'cycleActiveDays' | 'cycleRestDays', value: string) => {
        const numValue = parseInt(value) || 0;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                [field]: numValue
            }
        });
    };

    const renderFrequencyConfig = () => {
        switch (formData.frequencyType) {
            case FrequencyType.SPECIFIC_DAYS_OF_WEEK:
                return (
                    <View className="mt-6">
                        <Text className={`text-sm font-medium mb-3 ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('selectDays') || 'Select Days'}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                                <TouchableOpacity
                                    key={day.value}
                                    onPress={() => toggleDay(day.value)}
                                    className={`px-4 py-3 rounded-xl border ${
                                        formData.frequencyConfig.specificDays?.includes(day.value)
                                            ? 'border-indigo-500 border-2 bg-indigo-500/10'
                                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                    }`}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-medium ${
                                        formData.frequencyConfig.specificDays?.includes(day.value)
                                            ? 'text-indigo-500'
                                            : isDark ? 'text-slate-200' : 'text-gray-700'
                                    }`}>
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case FrequencyType.EVERY_X_DAYS:
                return (
                    <View className="mt-6">
                        <Text className={`text-sm font-medium mb-3 ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('intervalDays') || 'Every how many days?'}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                Every
                            </Text>
                            <TextInput
                                value={formData.frequencyConfig.intervalDays?.toString() || '1'}
                                onChangeText={updateIntervalDays}
                                className={`mx-3 px-3 py-2 rounded-lg border w-16 text-center ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                            <Text className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                days
                            </Text>
                        </View>
                    </View>
                );

            case FrequencyType.CYCLE_BASED:
                return (
                    <View className="mt-6">
                        <Text className={`text-sm font-medium mb-3 ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('cycleConfig') || 'Cycle Configuration'}
                        </Text>
                        <View className="space-y-4">
                            <View className="flex-row items-center">
                                <TextInput
                                    value={formData.frequencyConfig.cycleActiveDays?.toString() || '0'}
                                    onChangeText={(value) => updateCycleConfig('cycleActiveDays', value)}
                                    className={`px-3 py-2 rounded-lg border w-16 text-center ${
                                        isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                                <Text className={`ml-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    days active
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <TextInput
                                    value={formData.frequencyConfig.cycleRestDays?.toString() || '0'}
                                    onChangeText={(value) => updateCycleConfig('cycleRestDays', value)}
                                    className={`px-3 py-2 rounded-lg border w-16 text-center ${
                                        isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                                <Text className={`ml-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                    days rest
                                </Text>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('frequency') || 'Frequency'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('frequencyDescription') || 'How often do you take this medicine?'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Frequency Options */}
                <View className="space-y-3">
                    {frequencyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => selectFrequency(option.value)}
                            className={`p-4 rounded-xl border ${
                                formData.frequencyType === option.value
                                    ? 'border-indigo-500 border-2 bg-indigo-500/10'
                                    : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                            }`}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">{option.icon}</Text>
                                <View className="flex-1">
                                    <Text className={`font-semibold ${
                                        formData.frequencyType === option.value
                                            ? 'text-indigo-500'
                                            : isDark ? 'text-slate-100' : 'text-gray-800'
                                    }`}>
                                        {option.label}
                                    </Text>
                                    <Text className={`text-sm ${
                                        isDark ? 'text-slate-400' : 'text-gray-500'
                                    }`}>
                                        {option.description}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Frequency Configuration */}
                {renderFrequencyConfig()}

                {/* Selected Frequency Summary */}
                {formData.frequencyType && (
                    <View className={`p-4 rounded-xl mt-6 ${
                        isDark ? 'bg-slate-800' : 'bg-gray-50'
                    }`}>
                        <Text className={`font-semibold mb-2 ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {t('frequencySummary') || 'Frequency Summary'}
                        </Text>
                        <Text className={`text-sm ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {frequencyOptions.find(opt => opt.value === formData.frequencyType)?.label}
                            {formData.frequencyType === FrequencyType.SPECIFIC_DAYS_OF_WEEK &&
                                (formData.frequencyConfig.specificDays?.length || 0) > 0 && (
                                    ` - ${formData.frequencyConfig.specificDays?.length || 0} days selected`
                                )}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Help Text */}
            <View className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-orange-300' : 'text-orange-700'
                }`}>
                    💡 {t('frequencyTip') || 'Tip: Choose the frequency that matches your doctor\'s prescription exactly'}
                </Text>
            </View>
        </View>
    );
};

export default FrequencyStep;