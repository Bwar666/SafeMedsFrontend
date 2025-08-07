import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import SearchDropdown from '../SearchDropdown';

interface FormData {
    conditionReason: string;
    [key: string]: any;
}

interface ConditionStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const ConditionStep: React.FC<ConditionStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                         isDark,
                                                         t,
                                                         isRTL,
                                                     }) => {
    const commonConditions = [
        { id: '1', name: 'Headache', icon: '🤕' },
        { id: '2', name: 'Diabetes', icon: '🩺' },
        { id: '3', name: 'Hypertension', icon: '💗' },
        { id: '4', name: 'Arthritis', icon: '🦴' },
        { id: '5', name: 'Asthma', icon: '🫁' },
        { id: '6', name: 'Heart Disease', icon: '❤️' },
        { id: '7', name: 'Depression', icon: '🧠' },
        { id: '8', name: 'Allergies', icon: '🤧' },
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
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-8">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('conditionReason') || 'What condition is this for?'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('conditionDescription') || 'Tell us what this medicine is treating'}
                </Text>
            </View>

            {/* Condition Search Input */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                    {t('condition') || 'Condition'} *
                </Text>

                <SearchDropdown
                    value={formData.conditionReason}
                    onChangeText={handleConditionChange}
                    placeholder={t('searchCondition') || 'Search for condition or symptom...'}
                    searchType="condition"
                    isDark={isDark}
                    isRTL={isRTL}
                    onSelectResult={handleConditionSelect}
                />

                <Text className={`text-xs mt-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                    {t('conditionHint') || 'Start typing to search for conditions'}
                </Text>
            </View>

            {/* Quick Select Common Conditions */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                    {t('commonConditions') || 'Common Conditions'}
                </Text>

                <View className="flex-row flex-wrap gap-3">
                    {commonConditions.map((condition) => (
                        <TouchableOpacity
                            key={condition.id}
                            onPress={() => selectQuickCondition(condition)}
                            className={`flex-row items-center px-4 py-3 rounded-xl border ${
                                formData.conditionReason === condition.name
                                    ? 'border-indigo-500 border-2'
                                    : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                            }`}
                            activeOpacity={0.7}
                        >
                            <Text className="text-lg mr-2">{condition.icon}</Text>
                            <Text className={`text-sm font-medium ${
                                formData.conditionReason === condition.name
                                    ? 'text-indigo-500'
                                    : isDark ? 'text-slate-200' : 'text-gray-700'
                            }`}>
                                {condition.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Selected Condition Display */}
            {formData.conditionReason.length > 0 && (
                <View className={`p-4 rounded-xl mt-4 ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                    <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">🎯</Text>
                        <View className="flex-1">
                            <Text className={`font-semibold ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {formData.conditionReason}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('treatingCondition') || 'Treating this condition'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Help Text */}
            <View className={`mt-8 p-4 rounded-xl ${
                isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-green-300' : 'text-green-700'
                }`}>
                    💡 {t('conditionTip') || 'Tip: Be specific about your condition to get better medicine recommendations and warnings'}
                </Text>
            </View>
        </View>
    );
};

export default ConditionStep;