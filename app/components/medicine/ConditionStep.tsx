import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import SearchDropdown from '../SearchDropdown';
import { useLanguage } from "@/app/context/LanguageContext";
import {useTheme} from "@/app/context/ThemeContext";

interface FormData {
    conditionReason: string;
    [key: string]: any;
}

interface ConditionStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}

const ConditionStep: React.FC<ConditionStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                     }) => {
    const { theme, isDark } = useTheme();
    const { t, isRTL } = useLanguage();

    const commonConditions = [
        { id: '1', name: t('headache'), icon: '🤕' },
        { id: '2', name: t('diabetes'), icon: '🩺' },
        { id: '3', name: t('hypertension'), icon: '💗' },
        { id: '4', name: t('arthritis'), icon: '🦴' },
        { id: '5', name: t('asthma'), icon: '🫁' },
        { id: '6', name: t('heartDisease'), icon: '❤️' },
        { id: '7', name: t('depression'), icon: '🧠' },
        { id: '8', name: t('allergies'), icon: '🤧' },
    ];

    const handleConditionChange = (conditionReason: string) => {
        updateFormData({ conditionReason });
    };

    const handleConditionSelect = (result: any) => {
        updateFormData({ conditionReason: result.name });
    };

    const selectQuickCondition = (condition: { name: string }) => {
        updateFormData({ conditionReason: condition.name });
    };

    return (
        <View
            className="flex-1 p-5"
            style={{
                backgroundColor: theme.background,
            }}
        >
            <View className="mb-8">
                <Text
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: theme.text }}
                >
                    {t('conditionReason')}
                </Text>
                <Text
                    className="text-base text-center"
                    style={{ color: theme.textSecondary }}
                >
                    {t('conditionDescription')}
                </Text>
            </View>

            <View className="mb-6">
                <Text
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.text }}
                >
                    {t('condition')} *
                </Text>

                <SearchDropdown
                    value={formData.conditionReason}
                    onChangeText={handleConditionChange}
                    placeholder={t('searchCondition')}
                    searchType="condition"
                    isDark={isDark}
                    isRTL={isRTL}
                    onSelectResult={handleConditionSelect}
                />

                <Text
                    className="text-xs mt-2"
                    style={{ color: theme.textSecondary }}
                >
                    {t('conditionHint')}
                </Text>
            </View>

            <View className="mb-6">
                <Text
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.text }}
                >
                    {t('commonConditions')}
                </Text>

                <View className="flex-row flex-wrap gap-3">
                    {commonConditions.map((condition) => {
                        const isSelected = formData.conditionReason === condition.name;
                        return (
                            <TouchableOpacity
                                key={condition.id}
                                onPress={() => selectQuickCondition(condition)}
                                className="flex-row items-center px-4 py-3 rounded-xl border"
                                style={{
                                    borderColor: isSelected ? theme.primary : theme.border,
                                    borderWidth: isSelected ? 2 : 1,
                                    backgroundColor: isSelected ? theme.primaryLight : theme.card,
                                }}
                                activeOpacity={0.7}
                            >
                                <Text className="text-lg mr-2">{condition.icon}</Text>
                                <Text
                                    className="text-sm font-medium"
                                    style={{
                                        color: isSelected ? theme.primary : theme.text
                                    }}
                                >
                                    {condition.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {formData.conditionReason.length > 0 && (
                <View
                    className="p-4 rounded-xl mt-4"
                    style={{ backgroundColor: theme.surface }}
                >
                    <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">🎯</Text>
                        <View className="flex-1">
                            <Text
                                className="font-semibold"
                                style={{ color: theme.text }}
                            >
                                {formData.conditionReason}
                            </Text>
                            <Text
                                className="text-sm"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('treatingCondition')}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View
                className="mt-8 p-4 rounded-xl border"
                style={{
                    backgroundColor: theme.success + '22',
                    borderColor: theme.success + '33'
                }}
            >
                <Text
                    className="text-sm"
                    style={{ color: theme.success }}
                >
                    💡 {t('conditionTip')}
                </Text>
            </View>
        </View>
    );
};

export default ConditionStep;