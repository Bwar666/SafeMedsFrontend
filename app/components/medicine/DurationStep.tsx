import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { Calendar, Clock, Infinity, Info, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";


interface DurationStepProps {
    formData: {
        scheduleDuration: number | null;
        [key: string]: any;
    };
    updateFormData: (updates: any) => void;
}

const DurationStep: React.FC<DurationStepProps> = ({
                                                       formData,
                                                       updateFormData,
                                                   }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    const [hasEndDate, setHasEndDate] = useState(formData.scheduleDuration !== null);
    const [customDuration, setCustomDuration] = useState(
        formData.scheduleDuration?.toString() || '150'
    );

    // Common duration presets
    const durationPresets = [
        { label: t('threeDays') || '3 days', value: 3, description: t('shortCourse') || 'Short course treatment' },
        { label: t('oneWeek') || '1 week', value: 7, description: t('weeklyCourse') || 'Weekly course' },
        { label: t('twoWeeks') || '2 weeks', value: 14, description: t('twoWeekCourse') || 'Two week course' },
        { label: t('oneMonth') || '1 month', value: 30, description: t('monthlyTreatment') || 'Monthly treatment' },
        { label: t('threeMonths') || '3 months', value: 90, description: t('quarterlyTreatment') || 'Quarterly treatment' },
        { label: t('sixMonths') || '6 months', value: 180, description: t('semiAnnualTreatment') || 'Semi-annual treatment' },
        { label: t('oneYear') || '1 year', value: 365, description: t('annualTreatment') || 'Annual treatment' },
    ];

    const handleEndDateToggle = (enabled: boolean) => {
        Haptics.selectionAsync();
        setHasEndDate(enabled);

        if (enabled) {
            const duration = parseInt(customDuration) || 7;
            updateFormData({ scheduleDuration: duration });
        } else {
            updateFormData({ scheduleDuration: 150 });
        }
    };

    const handlePresetSelect = (value: number) => {
        Haptics.selectionAsync();
        setCustomDuration(value.toString());
        updateFormData({ scheduleDuration: value });
    };

    const handleCustomDurationChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9]/g, '');
        setCustomDuration(cleanedText);

        const duration = parseInt(cleanedText);
        if (!isNaN(duration)){
            if (duration > 0) {
                updateFormData({ scheduleDuration: duration });
            } else if (cleanedText === '') {
                updateFormData({ scheduleDuration: null });
            }
        }
    };

    const formatDuration = (days: number) => {
        if (days === 1) return t('oneDay') || '1 day';
        if (days < 7) return `${days} ${t('days') || 'days'}`;
        if (days === 7) return t('oneWeek') || '1 week';
        if (days === 14) return t('twoWeeks') || '2 weeks';
        if (days < 30) return `${Math.floor(days / 7)} ${t('weeks') || 'weeks'}, ${days % 7} ${t('days') || 'days'}`;
        if (days === 30) return t('oneMonth') || '1 month';
        if (days < 365) return `${Math.floor(days / 30)} ${t('months') || 'months'}`;
        if (days === 365) return t('oneYear') || '1 year';
        return `${Math.floor(days / 365)} ${t('years') || 'years'}, ${Math.floor((days % 365) / 30)} ${t('months') || 'months'}`;
    };

    const getCurrentDuration = () => {
        return formData.scheduleDuration || parseInt(customDuration) || 0;
    };

    const durationValue = getCurrentDuration();

    return (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Header */}
            <View className="mb-6">
                <Text style={{ color: theme.text }} className="text-2xl font-bold mb-2">
                    {t('treatmentDuration') || 'Treatment Duration'}
                </Text>
                <Text style={{ color: theme.textSecondary }} className="text-base">
                    {t('durationDescription') || 'How long will you be taking this medicine? (Optional)'}
                </Text>
            </View>

            {/* End Date Toggle Card */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-5 rounded-2xl mb-6 border shadow-sm">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        {hasEndDate ? (
                            <Calendar size={24} color={theme.textSecondary} />
                        ) : (
                            <Infinity size={24} color={theme.textSecondary} />
                        )}
                        <View className="ml-3 flex-1">
                            <Text style={{ color: theme.text }} className="text-lg font-semibold">
                                {hasEndDate ? (t('setEndDate') || 'Set End Date') : (t('continueIndefinitely') || 'Continue Indefinitely')}
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="text-sm">
                                {hasEndDate
                                    ? (t('specificDuration') || 'Treatment has a specific duration')
                                    : (t('untilDoctorSays') || 'Take until doctor says to stop')}
                            </Text>
                        </View>
                    </View>

                    <Switch
                        value={hasEndDate}
                        onValueChange={handleEndDateToggle}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={hasEndDate ? '#ffffff' : theme.textSecondary}
                    />
                </View>

                {!hasEndDate && (
                    <View style={{ backgroundColor: theme.surface }} className="mt-4 p-3 rounded-lg">
                        <Text style={{ color: theme.textSecondary }} className="text-sm">
                            {t('indefiniteMessage') || 'This medicine will continue for 5 months. You can always set an end date later or stop when your doctor advises.'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Duration Settings - Only show if end date is enabled */}
            {hasEndDate && (
                <>
                    {/* Quick Duration Presets Grid */}
                    <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-5 rounded-2xl mb-6 border shadow-sm">
                        <Text style={{ color: theme.text }} className="text-lg font-semibold mb-4">
                            {t('commonDurations') || 'Common Durations'}
                        </Text>

                        <View className="flex-row flex-wrap justify-between gap-3">
                            {durationPresets.map((preset) => (
                                <TouchableOpacity
                                    key={preset.value}
                                    onPress={() => handlePresetSelect(preset.value)}
                                    style={{
                                        backgroundColor: getCurrentDuration() === preset.value
                                            ? theme.primaryLight
                                            : theme.border,
                                        borderColor: getCurrentDuration() === preset.value
                                            ? theme.primary
                                            : theme.primary,
                                        borderWidth: getCurrentDuration() === preset.value ? 2 : 0,
                                    }}
                                    className="w-[48%] p-4 rounded-xl items-center"
                                    activeOpacity={0.8}
                                >
                                    <Text style={{
                                        color: getCurrentDuration() === preset.value
                                            ? theme.text
                                            : theme.text
                                    }} className="font-medium text-lg">
                                        {preset.label}
                                    </Text>
                                    <Text style={{
                                        color: getCurrentDuration() === preset.value
                                            ? theme.textSecondary
                                            : theme.textSecondary
                                    }} className="text-xs text-center mt-1">
                                        {preset.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Custom Duration Input */}
                    <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-5 rounded-2xl mb-6 border shadow-sm">
                        <Text style={{ color: theme.text }} className="text-lg font-semibold mb-4">
                            {t('customDuration') || 'Custom Duration'}
                        </Text>

                        <View>
                            <Text style={{ color: theme.text }} className="text-sm font-medium mb-2">
                                {t('numberOfDays') || 'Number of days'}
                            </Text>
                            <View className="flex-row items-center">
                                <TextInput
                                    value={customDuration}
                                    onChangeText={handleCustomDurationChange}
                                    placeholder="7"
                                    keyboardType="numeric"
                                    style={{
                                        color: theme.text,
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border
                                    }}
                                    className="flex-1 text-base px-4 py-3 rounded-lg border"
                                    placeholderTextColor={theme.textSecondary}
                                />
                                <Text style={{ color: theme.textSecondary }} className="ml-3">
                                    {t('days') || 'days'}
                                </Text>
                            </View>

                            {durationValue > 0 && (
                                <View className="flex-row items-center mt-4">
                                    <Calendar size={18} color={theme.textSecondary} />
                                    <Text style={{ color: theme.textSecondary }} className="ml-2">
                                        {t('approximately') || 'Approximately'} {formatDuration(durationValue)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Duration Summary */}
                    {durationValue > 0 && (
                        <View style={{ backgroundColor: `${theme.success}20`, borderColor: theme.success }} className="p-4 rounded-2xl mb-6 border">
                            <View className="flex-row items-start">
                                <Clock size={18} color={theme.success} />
                                <View className="ml-3 flex-1">
                                    <Text style={{ color: theme.success }} className="text-sm font-medium mb-1">
                                        {t('treatmentSummary') || 'Treatment Summary'}
                                    </Text>
                                    <Text style={{ color: theme.success }} className="text-xs">
                                        {t('treatmentSummaryMessage') || `You'll take this medicine for ${durationValue} days (${formatDuration(durationValue)}). The app will remind you when the treatment period is ending.`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </>
            )}

            {/* Help Information */}
            <View style={{ backgroundColor: `${theme.primary}20`, borderColor: theme.primary }} className="p-4 rounded-2xl border">
                <View className="flex-row items-start">
                    <Info size={16} color={theme.primary} />
                    <View className="ml-3 flex-1">
                        <Text style={{ color: theme.primary }} className="text-sm font-medium mb-1">
                            {t('aboutTreatmentDuration') || 'About Treatment Duration'}
                        </Text>
                        <Text style={{ color: theme.primary }} className="text-xs leading-relaxed">
                            {t('treatmentTips') || '• Always follow your doctor\'s specific instructions\n• Some medicines are taken for life (like blood pressure medication)\n• Others have specific courses (like antibiotics)\n• You can always adjust the duration later\n• The app will notify you when treatment is ending'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Validation Warning */}
            {hasEndDate && durationValue <= 0 && (
                <View style={{ backgroundColor: `${theme.error}20`, borderColor: theme.error }} className="mt-4 p-4 rounded-2xl border">
                    <View className="flex-row items-start">
                        <AlertCircle size={16} color={theme.error} />
                        <View className="ml-3 flex-1">
                            <Text style={{ color: theme.error }} className="text-sm font-medium">
                                {t('enterValidDuration') || 'Please enter a valid duration'}
                            </Text>
                            <Text style={{ color: theme.error }} className="text-xs mt-1">
                                {t('durationMustBePositive') || 'The duration must be a positive number of days.'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

export default DurationStep;