import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";

interface FormData {
    form: MedicineForm | null;
    [key: string]: any;
}

interface FormStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const FormStep: React.FC<FormStepProps> = ({
                                               formData,
                                               updateFormData,
                                               isDark,
                                               t,
                                               isRTL,
                                           }) => {
    const medicineFormOptions = [
        { value: MedicineForm.PILL, label: t('pill') || 'Pill', icon: '💊', description: 'Solid oral dosage form' },
        { value: MedicineForm.CAPSULE, label: t('capsule') || 'Capsule', icon: '🔴', description: 'Encapsulated medication' },
        { value: MedicineForm.TABLET, label: t('tablet') || 'Tablet', icon: '⚪', description: 'Compressed solid form' },
        { value: MedicineForm.INJECTION, label: t('injection') || 'Injection', icon: '💉', description: 'Injectable medication' },
        { value: MedicineForm.LIQUID, label: t('liquid') || 'Liquid', icon: '🧴', description: 'Liquid medication' },
        { value: MedicineForm.DROPS, label: t('drops') || 'Drops', icon: '💧', description: 'Eye/ear/nose drops' },
        { value: MedicineForm.INHALER, label: t('inhaler') || 'Inhaler', icon: '🫁', description: 'Inhaled medication' },
        { value: MedicineForm.POWDER, label: t('powder') || 'Powder', icon: '🥄', description: 'Powdered medication' },
        { value: MedicineForm.PATCH, label: t('patch') || 'Patch', icon: '🩹', description: 'Transdermal patch' },
        { value: MedicineForm.GEL, label: t('gel') || 'Gel', icon: '🧴', description: 'Topical gel' },
        { value: MedicineForm.SPRAY, label: t('spray') || 'Spray', icon: '💨', description: 'Spray medication' },
        { value: MedicineForm.OTHER, label: t('other') || 'Other', icon: '❓', description: 'Other form' },
    ];

    const selectForm = (form: MedicineForm) => {
        updateFormData({ form });
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('medicineForm') || 'Medicine Form'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('medicineFormDescription') || 'What form is your medicine in?'}
                </Text>
            </View>

            {/* Form Selection Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap justify-between">
                    {medicineFormOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => selectForm(option.value)}
                            className={`w-[48%] p-4 rounded-xl border mb-4 ${
                                formData.form === option.value
                                    ? 'border-indigo-500 border-2 bg-indigo-500/10'
                                    : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                            }`}
                            activeOpacity={0.7}
                        >
                            <View className="items-center">
                                <Text className="text-3xl mb-2">{option.icon}</Text>
                                <Text className={`font-semibold text-center mb-1 ${
                                    formData.form === option.value
                                        ? 'text-indigo-500'
                                        : isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {option.label}
                                </Text>
                                <Text className={`text-xs text-center ${
                                    isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}>
                                    {option.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Selected Form Display */}
            {formData.form && (
                <View className={`p-4 rounded-xl mt-4 ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                    <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">
                            {medicineFormOptions.find(opt => opt.value === formData.form)?.icon}
                        </Text>
                        <View className="flex-1">
                            <Text className={`font-semibold ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {medicineFormOptions.find(opt => opt.value === formData.form)?.label}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('selectedForm') || 'Selected form'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Help Text */}
            <View className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-purple-300' : 'text-purple-700'
                }`}>
                    💡 {t('formTip') || 'Tip: The form affects how and when you should take your medicine'}
                </Text>
            </View>
        </View>
    );
};

export default FormStep;