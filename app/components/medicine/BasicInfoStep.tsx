import React from 'react';
import { View, Text } from 'react-native';
import SearchDropdown from '../SearchDropdown';

interface FormData {
    name: string;
    [key: string]: any;
}

interface BasicInfoStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                         isDark,
                                                         t,
                                                         isRTL,
                                                     }) => {
    const handleNameChange = (name: string) => {
        updateFormData({ name });
    };

    const handleNameSelect = (result: any) => {
        updateFormData({
            name: result.name,
            // You can also pre-fill other fields based on the selected medicine
        });
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-8">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('medicineName') || 'Medicine Name'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('medicineNameDescription') || 'Enter the name of your medicine'}
                </Text>
            </View>

            {/* Medicine Name Input with Search */}
            <View className="mb-6">
                <Text className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                    {t('medicineName') || 'Medicine Name'} *
                </Text>

                <SearchDropdown
                    value={formData.name}
                    onChangeText={handleNameChange}
                    placeholder={t('searchMedicineName') || 'Search for medicine name...'}
                    searchType="medicine"
                    isDark={isDark}
                    isRTL={isRTL}
                    onSelectResult={handleNameSelect}
                />

                <Text className={`text-xs mt-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                    {t('medicineNameHint') || 'Start typing to search for medicines'}
                </Text>
            </View>

            {/* Visual Feedback */}
            {formData.name.length > 0 && (
                <View className={`p-4 rounded-xl mt-4 ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                    <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">💊</Text>
                        <View className="flex-1">
                            <Text className={`font-semibold ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {formData.name}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('selectedMedicine') || 'Selected medicine'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Help Text */}
            <View className={`mt-8 p-4 rounded-xl ${
                isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-blue-50 border border-blue-200'
            }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-indigo-300' : 'text-blue-700'
                }`}>
                    💡 {t('medicineNameTip') || 'Tip: You can search by brand name, generic name, or active ingredient'}
                </Text>
            </View>
        </View>
    );
};

export default BasicInfoStep;