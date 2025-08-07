import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { FoodInstruction } from '../../services/medicine/MedicineService';

interface FormData {
    foodInstruction: FoodInstruction | null;
    [key: string]: any;
}

interface FoodInstructionStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const FoodInstructionStep: React.FC<FoodInstructionStepProps> = ({
                                                                     formData,
                                                                     updateFormData,
                                                                     isDark,
                                                                     t,
                                                                     isRTL,
                                                                 }) => {
    const foodInstructions = [
        {
            value: FoodInstruction.BEFORE_EATING,
            label: t('beforeEating') || 'Before Eating',
            icon: '🍽️',
            description: 'Take 30-60 minutes before meals',
            details: 'Best absorption on empty stomach'
        },
        {
            value: FoodInstruction.WHILE_EATING,
            label: t('whileEating') || 'With Food',
            icon: '🍽️',
            description: 'Take during or right after meals',
            details: 'Reduces stomach irritation'
        },
        {
            value: FoodInstruction.AFTER_EATING,
            label: t('afterEating') || 'After Eating',
            icon: '🍴',
            description: 'Take 30-60 minutes after meals',
            details: 'Better tolerance after food'
        },
        {
            value: FoodInstruction.EMPTY_STOMACH,
            label: t('emptyStomach') || 'Empty Stomach',
            icon: '⏰',
            description: 'Take 1 hour before or 2 hours after eating',
            details: 'Maximum absorption without food'
        },
        {
            value: FoodInstruction.DOES_NOT_MATTER,
            label: t('doesNotMatter') || 'Anytime',
            icon: '🤷',
            description: 'Can be taken with or without food',
            details: 'Food does not affect this medicine'
        },
    ];

    const selectFoodInstruction = (instruction: FoodInstruction) => {
        updateFormData({ foodInstruction: instruction });
    };

    const getInstructionColor = (instruction: FoodInstruction) => {
        switch (instruction) {
            case FoodInstruction.BEFORE_EATING:
                return 'orange';
            case FoodInstruction.WHILE_EATING:
                return 'green';
            case FoodInstruction.AFTER_EATING:
                return 'blue';
            case FoodInstruction.EMPTY_STOMACH:
                return 'purple';
            case FoodInstruction.DOES_NOT_MATTER:
                return 'gray';
            default:
                return 'gray';
        }
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('foodInstructions') || 'Food Instructions'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('foodInstructionsDescription') || 'How should this medicine be taken with food?'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Food Instruction Options */}
                <View className="space-y-4">
                    {foodInstructions.map((instruction) => {
                        const color = getInstructionColor(instruction.value);
                        const isSelected = formData.foodInstruction === instruction.value;

                        return (
                            <TouchableOpacity
                                key={instruction.value}
                                onPress={() => selectFoodInstruction(instruction.value)}
                                className={`p-4 rounded-xl border ${
                                    isSelected
                                        ? `border-${color}-500 border-2 bg-${color}-500/10`
                                        : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                }`}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-start">
                                    <Text className="text-3xl mr-4">{instruction.icon}</Text>
                                    <View className="flex-1">
                                        <Text className={`text-lg font-semibold mb-1 ${
                                            isSelected
                                                ? `text-${color}-500`
                                                : isDark ? 'text-slate-100' : 'text-gray-800'
                                        }`}>
                                            {instruction.label}
                                        </Text>
                                        <Text className={`text-sm mb-2 ${
                                            isDark ? 'text-slate-300' : 'text-gray-600'
                                        }`}>
                                            {instruction.description}
                                        </Text>
                                        <Text className={`text-xs ${
                                            isDark ? 'text-slate-400' : 'text-gray-500'
                                        }`}>
                                            💡 {instruction.details}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View className={`w-6 h-6 rounded-full bg-${color}-500 items-center justify-center`}>
                                            <Text className="text-white text-xs font-bold">✓</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Selected Instruction Summary */}
                {formData.foodInstruction && (
                    <View className={`p-4 rounded-xl mt-6 ${
                        isDark ? 'bg-slate-800' : 'bg-gray-50'
                    }`}>
                        <Text className={`font-semibold mb-2 ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {t('selectedInstruction') || 'Selected Instruction'}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-2xl mr-3">
                                {foodInstructions.find(inst => inst.value === formData.foodInstruction)?.icon}
                            </Text>
                            <View className="flex-1">
                                <Text className={`font-medium ${
                                    isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {foodInstructions.find(inst => inst.value === formData.foodInstruction)?.label}
                                </Text>
                                <Text className={`text-sm ${
                                    isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}>
                                    {foodInstructions.find(inst => inst.value === formData.foodInstruction)?.description}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Food Interaction Warning */}
                {formData.foodInstruction === FoodInstruction.EMPTY_STOMACH && (
                    <View className={`p-4 rounded-xl mt-4 ${
                        isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                    }`}>
                        <View className="flex-row items-start">
                            <Text className="text-2xl mr-3">⚠️</Text>
                            <View className="flex-1">
                                <Text className={`font-semibold mb-1 ${
                                    isDark ? 'text-amber-300' : 'text-amber-800'
                                }`}>
                                    {t('importantNote') || 'Important Note'}
                                </Text>
                                <Text className={`text-sm ${
                                    isDark ? 'text-amber-300' : 'text-amber-700'
                                }`}>
                                    {t('emptyStomachWarning') || 'Taking on empty stomach may cause nausea. If you experience stomach upset, consult your doctor about taking with food.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Helpful Tips */}
                <View className={`p-4 rounded-xl mt-6 ${
                    isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                    <Text className={`font-semibold mb-2 ${
                        isDark ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                        💡 {t('helpfulTips') || 'Helpful Tips'}
                    </Text>
                    <View className="space-y-2">
                        <Text className={`text-sm ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                            • {t('tip1') || 'Always follow your doctor\'s specific instructions'}
                        </Text>
                        <Text className={`text-sm ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                            • {t('tip2') || 'Some medicines work better with certain foods'}
                        </Text>
                        <Text className={`text-sm ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                            • {t('tip3') || 'Taking with food can reduce stomach irritation'}
                        </Text>
                        <Text className={`text-sm ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                            • {t('tip4') || 'Empty stomach means 1 hour before or 2 hours after eating'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default FoodInstructionStep;