import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';

interface FormData {
    scheduleDuration: number;
    refillReminderThreshold: number;
    [key: string]: any;
}

interface DurationStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const DurationStep: React.FC<DurationStepProps> = ({
                                                       formData,
                                                       updateFormData,
                                                       isDark,
                                                       t,
                                                       isRTL,
                                                   }) => {
    const commonDurations = [
        { label: t('threeDays') || '3 Days', days: 3, icon: '📅' },
        { label: t('oneWeek') || '1 Week', days: 7, icon: '📆' },
        { label: t('twoWeeks') || '2 Weeks', days: 14, icon: '🗓️' },
        { label: t('oneMonth') || '1 Month', days: 30, icon: '📋' },
        { label: t('twoMonths') || '2 Months', days: 60, icon: '📅' },
        { label: t('threeMonths') || '3 Months', days: 90, icon: '🗓️' },
        { label: t('ongoing') || 'Ongoing', days: 365, icon: '♾️' },
    ];

    const reminderThresholds = [
        { label: t('threeDaysBefore') || '3 days before', days: 3 },
        { label: t('fiveDaysBefore') || '5 days before', days: 5 },
        { label: t('oneWeekBefore') || '1 week before', days: 7 },
        { label: t('twoWeeksBefore') || '2 weeks before', days: 14 },
    ];

    const selectDuration = (days: number) => {
        updateFormData({ scheduleDuration: days });
    };

    const selectReminderThreshold = (days: number) => {
        updateFormData({ refillReminderThreshold: days });
    };

    const updateCustomDuration = (value: string) => {
        const days = parseInt(value) || 1;
        updateFormData({ scheduleDuration: days });
    };

    const updateCustomReminder = (value: string) => {
        const days = parseInt(value) || 1;
        updateFormData({ refillReminderThreshold: days });
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

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('duration') || 'Duration & Reminders'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('durationDescription') || 'How long will you take this medicine?'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Treatment Duration */}
                <View className="mb-8">
                    <Text className={`text-sm font-medium mb-4 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        {t('treatmentDuration') || 'Treatment Duration'}
                    </Text>

                    <View className="flex-row flex-wrap gap-3 mb-4">
                        {commonDurations.map((duration) => (
                            <TouchableOpacity
                                key={duration.days}
                                onPress={() => selectDuration(duration.days)}
                                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                                    formData.scheduleDuration === duration.days
                                        ? 'border-indigo-500 border-2 bg-indigo-500/10'
                                        : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className="text-lg mr-2">{duration.icon}</Text>
                                <Text className={`font-medium ${
                                    formData.scheduleDuration === duration.days
                                        ? 'text-indigo-500'
                                        : isDark ? 'text-slate-200' : 'text-gray-700'
                                }`}>
                                    {duration.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Duration Input */}
                    <View className={`p-4 rounded-xl border ${
                        isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                    }`}>
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('customDuration') || 'Custom Duration'}
                        </Text>
                        <View className="flex-row items-center">
                            <TextInput
                                value={formData.scheduleDuration.toString()}
                                onChangeText={updateCustomDuration}
                                className={`px-3 py-2 rounded-lg border w-20 text-center mr-3 ${
                                    isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                keyboardType="numeric"
                                placeholder="30"
                                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            />
                            <Text className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('days') || 'days'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Refill Reminder */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-4 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        {t('refillReminder') || 'Refill Reminder'}
                    </Text>

                    <View className="flex-row flex-wrap gap-3 mb-4">
                        {reminderThresholds.map((threshold) => (
                            <TouchableOpacity
                                key={threshold.days}
                                onPress={() => selectReminderThreshold(threshold.days)}
                                className={`px-4 py-3 rounded-xl border ${
                                    formData.refillReminderThreshold === threshold.days
                                        ? 'border-purple-500 border-2 bg-purple-500/10'
                                        : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-medium ${
                                    formData.refillReminderThreshold === threshold.days
                                        ? 'text-purple-500'
                                        : isDark ? 'text-slate-200' : 'text-gray-700'
                                }`}>
                                    {threshold.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Reminder Input */}
                    <View className={`p-4 rounded-xl border ${
                        isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                    }`}>
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                            {t('customReminder') || 'Custom Reminder'}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className={`mr-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('remindMe') || 'Remind me'}
                            </Text>
                            <TextInput
                                value={formData.refillReminderThreshold.toString()}
                                onChangeText={updateCustomReminder}
                                className={`px-3 py-2 rounded-lg border w-16 text-center mx-2 ${
                                    isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                keyboardType="numeric"
                                placeholder="5"
                                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            />
                            <Text className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {t('daysBefore') || 'days before running out'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Summary */}
                <View className={`p-4 rounded-xl ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                    <Text className={`font-semibold mb-3 ${
                        isDark ? 'text-slate-100' : 'text-gray-800'
                    }`}>
                        {t('treatmentSummary') || 'Treatment Summary'}
                    </Text>

                    <View className="space-y-2">
                        <View className="flex-row justify-between">
                            <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {t('duration') || 'Duration'}:
                            </Text>
                            <Text className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {formatDuration(formData.scheduleDuration)}
                            </Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {t('refillReminder') || 'Refill reminder'}:
                            </Text>
                            <Text className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {formData.refillReminderThreshold} {formData.refillReminderThreshold === 1 ? 'day' : 'days'} before
                            </Text>
                        </View>

                        {formData.scheduleDuration < 365 && (
                            <View className="flex-row justify-between">
                                <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {t('endDate') || 'Estimated end'}:
                                </Text>
                                <Text className={`font-medium ${
                                    isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {new Date(Date.now() + formData.scheduleDuration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Help Text */}
            <View className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-yellow-300' : 'text-yellow-700'
                }`}>
                    💡 {t('durationTip') || 'Tip: Set the duration as prescribed. You can always extend or modify it later.'}
                </Text>
            </View>
        </View>
    );
};

export default DurationStep;