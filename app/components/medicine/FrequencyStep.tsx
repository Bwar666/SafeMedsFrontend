import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { DayOfWeek, FrequencyConfig, FrequencyType } from "@/app/services/medicine/medicine/MedicineServiceTypes";
import { useLanguage } from "@/app/context/LanguageContext";
import {useTheme} from "@/app/context/ThemeContext";

interface FormData {
    frequencyType: FrequencyType | null;
    frequencyConfig: FrequencyConfig;
    [key: string]: any;
}

interface FrequencyStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}

const FrequencyStep: React.FC<FrequencyStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                     }) => {
    const { theme, isDark } = useTheme();
    const { t, isRTL } = useLanguage();
    const [expandedOption, setExpandedOption] = useState<FrequencyType | null>(null);

    const frequencyOptions = [
        {
            value: FrequencyType.DAILY,
            label: t('daily'),
            icon: '📅',
            description: t('dailyDescription'),
            hasConfig: false
        },
        {
            value: FrequencyType.EVERY_OTHER_DAY,
            label: t('everyOtherDay'),
            icon: '📆',
            description: t('everyOtherDayDescription'),
            hasConfig: false
        },
        {
            value: FrequencyType.SPECIFIC_DAYS_OF_WEEK,
            label: t('specificDays'),
            icon: '🗓️',
            description: t('specificDaysDescription'),
            hasConfig: true
        },
        {
            value: FrequencyType.EVERY_X_DAYS,
            label: t('everyXDays'),
            icon: '⏰',
            description: t('everyXDaysDescription'),
            hasConfig: true
        },
        {
            value: FrequencyType.EVERY_X_WEEKS,
            label: t('everyXWeeks'),
            icon: '📋',
            description: t('everyXWeeksDescription'),
            hasConfig: true
        },
        {
            value: FrequencyType.EVERY_X_MONTHS,
            label: t('everyXMonths'),
            icon: '🗓️',
            description: t('everyXMonthsDescription'),
            hasConfig: true
        },
        {
            value: FrequencyType.CYCLE_BASED,
            label: t('cycleBased'),
            icon: '🔄',
            description: t('cycleBasedDescription'),
            hasConfig: true
        },
    ];

    const daysOfWeek = [
        { value: DayOfWeek.MONDAY, label: t('monday') },
        { value: DayOfWeek.TUESDAY, label: t('tuesday') },
        { value: DayOfWeek.WEDNESDAY, label: t('wednesday') },
        { value: DayOfWeek.THURSDAY, label: t('thursday') },
        { value: DayOfWeek.FRIDAY, label: t('friday') },
        { value: DayOfWeek.SATURDAY, label: t('saturday') },
        { value: DayOfWeek.SUNDAY, label: t('sunday') },
    ];

    const selectFrequency = (frequencyType: FrequencyType) => {
        if (formData.frequencyType !== frequencyType) {
            const newConfig: FrequencyConfig = {
                intervalDays: 0,
                specificDays: [],
                cycleActiveDays: 0,
                cycleRestDays: 0,
            };

            if (frequencyType === FrequencyType.EVERY_X_WEEKS) {
                newConfig.intervalDays = 1;
            } else if (frequencyType === FrequencyType.EVERY_X_MONTHS) {
                newConfig.intervalDays = 30;
            }

            updateFormData({
                frequencyType,
                frequencyConfig: newConfig
            });
        }

        if (expandedOption === frequencyType) {
            setExpandedOption(null);
        } else {
            setExpandedOption(frequencyType);
        }
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
        if (days === '') {
            updateFormData({
                frequencyConfig: {
                    ...formData.frequencyConfig,
                    intervalDays: 0
                }
            });
            return;
        }

        const intervalDays = parseInt(days) || 1;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                intervalDays
            }
        });
    };

    const updateIntervalWeeks = (weeks: string) => {
        if (weeks === '') {
            updateFormData({
                frequencyConfig: {
                    ...formData.frequencyConfig,
                    intervalDays: 0
                }
            });
            return;
        }

        const weeksValue = parseInt(weeks) || 1;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                intervalDays: weeksValue * 7
            }
        });
    };

    const updateIntervalMonths = (months: string) => {
        if (months === '') {
            updateFormData({
                frequencyConfig: {
                    ...formData.frequencyConfig,
                    intervalDays: 0
                }
            });
            return;
        }

        const monthsValue = parseInt(months) || 1;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                intervalDays: monthsValue * 30
            }
        });
    };

    const updateCycleConfig = (field: 'cycleActiveDays' | 'cycleRestDays', value: string) => {
        if (value === '') {
            updateFormData({
                frequencyConfig: {
                    ...formData.frequencyConfig,
                    [field]: 0
                }
            });
            return;
        }

        const numValue = parseInt(value) || 0;
        updateFormData({
            frequencyConfig: {
                ...formData.frequencyConfig,
                [field]: numValue
            }
        });
    };

    const renderConfigSection = (option: FrequencyType) => {
        switch (option) {
            case FrequencyType.SPECIFIC_DAYS_OF_WEEK:

                return (
                    <View
                        className="mt-3 p-4 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="text-base font-medium mb-4"
                            style={{ color: theme.text }}
                        >
                            {t('selectDays')}
                        </Text>
                        <View className="flex-row flex-wrap gap-2.5 justify-center">
                            {daysOfWeek.map((day) => {
                                const isSelected = formData.frequencyConfig.specificDays?.includes(day.value);
                                return (
                                    <TouchableOpacity
                                        key={day.value}
                                        onPress={() => toggleDay(day.value)}
                                        className="w-14 h-14 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: isSelected
                                                ? theme.primary
                                                : theme.card,
                                            borderWidth: isSelected ? 0 : 1,
                                            borderColor: theme.border,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className="font-medium text-center"
                                            style={{
                                                color: isSelected ? theme.card : theme.text
                                            }}
                                        >
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case FrequencyType.EVERY_X_DAYS:
                return (
                    <View
                        className="mt-3 p-4 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="text-base font-medium mb-3"
                            style={{ color: theme.text }}
                        >
                            {t('intervalDays')}
                        </Text>
                        <View className="flex-row items-center justify-between">
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('every')}
                            </Text>
                            <TextInput
                                value={formData.frequencyConfig.intervalDays?.toString() || ''}
                                onChangeText={updateIntervalDays}
                                className="px-4 py-3 rounded-xl border text-center w-24"
                                style={{
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    color: theme.text,
                                }}
                                keyboardType="number-pad"
                                maxLength={3}
                                placeholder="1"
                                placeholderTextColor={theme.textSecondary}
                            />
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('days')}
                            </Text>
                        </View>
                    </View>
                );

            case FrequencyType.EVERY_X_WEEKS:
                return (
                    <View
                        className="mt-3 p-4 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="text-base font-medium mb-3"
                            style={{ color: theme.text }}
                        >
                            {t('setWeeklyInterval')}
                        </Text>
                        <View className="flex-row items-center justify-between">
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('every')}
                            </Text>
                            <TextInput
                                value={formData.frequencyConfig.intervalDays
                                    ? Math.floor(formData.frequencyConfig.intervalDays / 7).toString()
                                    : ''}
                                onChangeText={updateIntervalWeeks}
                                className="px-4 py-3 rounded-xl border text-center w-24"
                                style={{
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    color: theme.text,
                                }}
                                keyboardType="number-pad"
                                maxLength={2}
                                placeholder="1"
                                placeholderTextColor={theme.textSecondary}
                            />
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('weeks')}
                            </Text>
                        </View>
                    </View>
                );

            case FrequencyType.EVERY_X_MONTHS:
                return (
                    <View
                        className="mt-3 p-4 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="text-base font-medium mb-3"
                            style={{ color: theme.text }}
                        >
                            {t('setMonthlyInterval')}
                        </Text>
                        <View className="flex-row items-center justify-between">
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('every')}
                            </Text>
                            <TextInput
                                value={formData.frequencyConfig.intervalDays
                                    ? Math.floor(formData.frequencyConfig.intervalDays / 30).toString()
                                    : ''}
                                onChangeText={updateIntervalMonths}
                                className="px-4 py-3 rounded-xl border text-center w-24"
                                style={{
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    color: theme.text,
                                }}
                                keyboardType="number-pad"
                                maxLength={2}
                                placeholder="1"
                                placeholderTextColor={theme.textSecondary}
                            />
                            <Text
                                className="text-base"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('months')}
                            </Text>
                        </View>
                    </View>
                );

            case FrequencyType.CYCLE_BASED:
                return (
                    <View
                        className="mt-3 p-4 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="text-base font-medium mb-4"
                            style={{ color: theme.text }}
                        >
                            {t('cycleConfig')}
                        </Text>
                        <View className="flex-row justify-between">
                            <View className="flex-1 mr-2">
                                <Text
                                    className="text-sm mb-2"
                                    style={{ color: theme.textSecondary }}
                                >
                                    {t('daysActive')}
                                </Text>
                                <TextInput
                                    value={formData.frequencyConfig.cycleActiveDays?.toString() || ''}
                                    onChangeText={(value) => updateCycleConfig('cycleActiveDays', value)}
                                    className="px-4 py-3 rounded-xl border text-center"
                                    style={{
                                        backgroundColor: theme.card,
                                        borderColor: theme.border,
                                        color: theme.text,
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View className="flex-1 ml-2">
                                <Text
                                    className="text-sm mb-2"
                                    style={{ color: theme.textSecondary }}
                                >
                                    {t('daysRest')}
                                </Text>
                                <TextInput
                                    value={formData.frequencyConfig.cycleRestDays?.toString() || ''}
                                    onChangeText={(value) => updateCycleConfig('cycleRestDays', value)}
                                    className="px-4 py-3 rounded-xl border text-center"
                                    style={{
                                        backgroundColor: theme.card,
                                        borderColor: theme.border,
                                        color: theme.text,
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    const styles = StyleSheet.create({
        optionContainer: {
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
        },
        selectedOption: {
            borderColor: theme.primary,
            borderWidth: 2,
            backgroundColor: theme.primaryLight,
        },
        optionTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: theme.text,
        },
        selectedTitle: {
            color: theme.primary,
        },
        optionDescription: {
            fontSize: 14,
            marginTop: 6,
            color: theme.textSecondary,
        },
    });

    return (
        <View
            className="flex-1 p-5"
            style={{
                backgroundColor: theme.background,
            }}
        >
            <View className="mb-6">
                <Text
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: theme.text }}
                >
                    {t('frequency')}
                </Text>
                <Text
                    className="text-base text-center px-2"
                    style={{ color: theme.textSecondary }}
                >
                    {t('frequencyDescription')}
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                className="pb-4"
                keyboardShouldPersistTaps="handled"
            >
                <View className="space-y-3">
                    {frequencyOptions.map((option) => (
                        <View key={option.value}>
                            <TouchableOpacity
                                onPress={() => selectFrequency(option.value)}
                                style={[
                                    styles.optionContainer,
                                    formData.frequencyType === option.value && styles.selectedOption
                                ]}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-3">{option.icon}</Text>
                                    <View className="flex-1">
                                        <Text style={[
                                            styles.optionTitle,
                                            formData.frequencyType === option.value && styles.selectedTitle
                                        ]}>
                                            {option.label}
                                        </Text>
                                        <Text style={styles.optionDescription}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {formData.frequencyType === option.value && expandedOption === option.value && (
                                <View className="mt-2">
                                    {renderConfigSection(option.value)}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {formData.frequencyType && (
                    <View
                        className="p-4 rounded-xl mt-6"
                        style={{ backgroundColor: theme.surface }}
                    >
                        <Text
                            className="font-semibold mb-2"
                            style={{ color: theme.text }}
                        >
                            {t('frequencySummary')}
                        </Text>
                        <Text
                            className="text-base"
                            style={{ color: theme.textSecondary }}
                        >
                            {frequencyOptions.find(opt => opt.value === formData.frequencyType)?.label}
                            {formData.frequencyType === FrequencyType.SPECIFIC_DAYS_OF_WEEK &&
                                (formData.frequencyConfig.specificDays?.length || 0) > 0 && (
                                    ` - ${formData.frequencyConfig.specificDays?.length || 0} ${t('daysSelected')}`
                                )}
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View
                className="mt-4 p-4 rounded-xl border"
                style={{
                    backgroundColor: theme.warning + '22',
                    borderColor: theme.warning + '33'
                }}
            >
                <Text
                    className="text-sm"
                    style={{ color: theme.warning }}
                >
                    💡 {t('frequencyTip')}
                </Text>
            </View>
        </View>
    );
};

export default FrequencyStep;