import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { FoodInstruction } from "@/app/services/medicine/medicine/MedicineServiceTypes";
import { useLanguage } from "@/app/context/LanguageContext";
import {useTheme} from "@/app/context/ThemeContext";

interface FormData {
    foodInstruction: FoodInstruction | null;
    [key: string]: any;
}

interface FoodInstructionStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}

const FoodInstructionStep: React.FC<FoodInstructionStepProps> = ({
                                                                     formData,
                                                                     updateFormData,
                                                                 }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    const foodInstructions = [
        {
            value: FoodInstruction.BEFORE_EATING,
            label: t('beforeEating'),
            icon: '🍽️',
            description: t('beforeEatingDesc'),
            details: t('beforeEatingDetails')
        },
        {
            value: FoodInstruction.WHILE_EATING,
            label: t('whileEating'),
            icon: '🍽️',
            description: t('whileEatingDesc'),
            details: t('whileEatingDetails')
        },
        {
            value: FoodInstruction.AFTER_EATING,
            label: t('afterEating'),
            icon: '🍴',
            description: t('afterEatingDesc'),
            details: t('afterEatingDetails')
        },
        {
            value: FoodInstruction.EMPTY_STOMACH,
            label: t('emptyStomach'),
            icon: '⏰',
            description: t('emptyStomachDesc'),
            details: t('emptyStomachDetails')
        },
        {
            value: FoodInstruction.DOES_NOT_MATTER,
            label: t('doesNotMatter'),
            icon: '🤷',
            description: t('doesNotMatterDesc'),
            details: t('doesNotMatterDetails')
        },
    ];

    const selectFoodInstruction = (instruction: FoodInstruction) => {
        updateFormData({ foodInstruction: instruction });
    };

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
                    {t('foodInstructions')}
                </Text>
                <Text
                    className="text-base text-center"
                    style={{ color: theme.textSecondary }}
                >
                    {t('foodInstructionsDescription')}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4 ">
                    {foodInstructions.map((instruction) => {
                        const isSelected = formData.foodInstruction === instruction.value;

                        return (
                            <TouchableOpacity
                                key={instruction.value}
                                onPress={() => selectFoodInstruction(instruction.value)}
                                className="p-4 rounded-xl border mb-2"
                                style={{
                                    borderColor: isSelected ? theme.secondary : theme.border,
                                    borderWidth: isSelected ? 2 : 1,
                                    backgroundColor: isSelected ? theme.secondary + '22' : theme.card,
                                }}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-start">
                                    <Text className="text-3xl mr-4">{instruction.icon}</Text>
                                    <View className="flex-1">
                                        <Text
                                            className="text-lg font-semibold mb-1"
                                            style={{ color: isSelected ? theme.secondary : theme.text }}
                                        >
                                            {instruction.label}
                                        </Text>
                                        <Text
                                            className="text-sm mb-2"
                                            style={{ color: theme.textSecondary }}
                                        >
                                            {instruction.description}
                                        </Text>
                                        <Text
                                            className="text-xs"
                                            style={{ color: theme.textSecondary }}
                                        >
                                            💡 {instruction.details}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View
                                            className="w-6 h-6 rounded-full items-center justify-center"
                                            style={{ backgroundColor: theme.secondary }}
                                        >
                                            <Text
                                                className="text-xs font-bold"
                                                style={{ color: theme.card }}
                                            >
                                                ✓
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {formData.foodInstruction === FoodInstruction.EMPTY_STOMACH && (
                    <View
                        className="p-4 rounded-xl mt-4 border"
                        style={{
                            backgroundColor: theme.warning + '22',
                            borderColor: theme.warning + '33'
                        }}
                    >
                        <View className="flex-row items-start">
                            <Text className="text-2xl mr-3">⚠️</Text>
                            <View className="flex-1">
                                <Text
                                    className="font-semibold mb-1"
                                    style={{ color: theme.warning }}
                                >
                                    {t('importantNote')}
                                </Text>
                                <Text
                                    className="text-sm"
                                    style={{ color: theme.warning }}
                                >
                                    {t('emptyStomachWarning')}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View
                    className="p-4 rounded-xl mt-6 border"
                    style={{
                        backgroundColor: theme.primary + '22',
                        borderColor: theme.primary + '33'
                    }}
                >
                    <Text
                        className="font-semibold mb-2"
                        style={{ color: theme.primary }}
                    >
                        💡 {t('helpfulTips')}
                    </Text>
                    <View className="space-y-2">
                        <Text
                            className="text-sm"
                            style={{ color: theme.primary }}
                        >
                            • {t('tip1')}
                        </Text>
                        <Text
                            className="text-sm"
                            style={{ color: theme.primary }}
                        >
                            • {t('tip2')}
                        </Text>
                        <Text
                            className="text-sm"
                            style={{ color: theme.primary }}
                        >
                            • {t('tip3')}
                        </Text>
                        <Text
                            className="text-sm"
                            style={{ color: theme.primary }}
                        >
                            • {t('tip4')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default FoodInstructionStep;