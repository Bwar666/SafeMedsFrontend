// Create this file: app/components/medicine/InventoryStep.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch } from 'react-native';
import { Package, Bell, Clock, AlertCircle } from 'lucide-react-native';
import {MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";

interface FormData {
    form: MedicineForm | null;
    currentInventory: number;
    totalInventory: number;
    inventoryUnit: string;
    autoDeductInventory: boolean;
    notificationsEnabled: boolean;
    missedDoseThresholdMinutes: number;
    allowLateIntake: boolean;
    lateIntakeWindowHours: number;
    [key: string]: any;
}

interface InventoryStepProps {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
    isDark: boolean;
    t: (key: string) => string;
    isRTL: boolean;
}

const InventoryStep: React.FC<InventoryStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                         isDark,
                                                         t,
                                                         isRTL,
                                                     }) => {
    const getDefaultUnit = (form: MedicineForm | null): string => {
        switch (form) {
            case MedicineForm.PILL:
            case MedicineForm.CAPSULE:
            case MedicineForm.TABLET:
                return 'pills';
            case MedicineForm.LIQUID:
                return 'ml';
            case MedicineForm.INJECTION:
                return 'units';
            case MedicineForm.DROPS:
                return 'drops';
            case MedicineForm.POWDER:
                return 'sachets';
            case MedicineForm.PATCH:
                return 'patches';
            default:
                return 'doses';
        }
    };

    const commonInventoryUnits = [
        { value: 'pills', label: t('pills') || 'Pills', forms: ['PILL', 'CAPSULE', 'TABLET'] },
        { value: 'ml', label: t('ml') || 'ML', forms: ['LIQUID', 'GEL'] },
        { value: 'drops', label: t('drops') || 'Drops', forms: ['DROPS'] },
        { value: 'units', label: t('units') || 'Units', forms: ['INJECTION'] },
        { value: 'sachets', label: t('sachets') || 'Sachets', forms: ['POWDER'] },
        { value: 'patches', label: t('patches') || 'Patches', forms: ['PATCH'] },
        { value: 'puffs', label: t('puffs') || 'Puffs', forms: ['INHALER', 'SPRAY'] },
        { value: 'doses', label: t('doses') || 'Doses', forms: ['OTHER'] },
    ];

    const commonInventoryAmounts = [15, 30, 60, 90, 120];

    const reminderThresholds = [
        { value: 30, label: t('30Minutes') || '30 minutes' },
        { value: 60, label: t('1Hour') || '1 hour' },
        { value: 120, label: t('2Hours') || '2 hours' },
        { value: 240, label: t('4Hours') || '4 hours' },
    ];

    const lateIntakeWindows = [
        { value: 1, label: t('1Hour') || '1 hour' },
        { value: 2, label: t('2Hours') || '2 hours' },
        { value: 4, label: t('4Hours') || '4 hours' },
        { value: 8, label: t('8Hours') || '8 hours' },
        { value: 12, label: t('12Hours') || '12 hours' },
    ];

    // Auto-set unit based on medicine form
    React.useEffect(() => {
        if (formData.form) {
            const defaultUnit = getDefaultUnit(formData.form);
            if (formData.inventoryUnit !== defaultUnit) {
                updateFormData({ inventoryUnit: defaultUnit });
            }
        }
    }, [formData.form]);

    const updateCurrentInventory = (value: string) => {
        const amount = parseInt(value) || 0;
        updateFormData({ currentInventory: amount });
    };

    const updateTotalInventory = (value: string) => {
        const amount = parseInt(value) || 0;
        updateFormData({
            totalInventory: amount,
            currentInventory: Math.min(formData.currentInventory, amount)
        });
    };

    const selectCommonAmount = (amount: number) => {
        updateFormData({
            totalInventory: amount,
            currentInventory: Math.min(formData.currentInventory, amount)
        });
    };

    const selectUnit = (unit: string) => {
        updateFormData({ inventoryUnit: unit });
    };

    const toggleAutoDeduct = (value: boolean) => {
        updateFormData({ autoDeductInventory: value });
    };

    const toggleNotifications = (value: boolean) => {
        updateFormData({ notificationsEnabled: value });
    };

    const toggleLateIntake = (value: boolean) => {
        updateFormData({ allowLateIntake: value });
    };

    const selectReminderThreshold = (minutes: number) => {
        updateFormData({ missedDoseThresholdMinutes: minutes });
    };

    const selectLateWindow = (hours: number) => {
        updateFormData({ lateIntakeWindowHours: hours });
    };

    const getInventoryPercentage = () => {
        if (formData.totalInventory === 0) return 0;
        return Math.round((formData.currentInventory / formData.totalInventory) * 100);
    };

    return (
        <View className="flex-1 p-5">
            {/* Header */}
            <View className="mb-6">
                <Text className={`text-2xl font-bold text-center mb-2 ${
                    isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {t('inventorySettings') || 'Inventory & Settings'}
                </Text>
                <Text className={`text-base text-center ${
                    isDark ? 'text-slate-300' : 'text-gray-500'
                }`}>
                    {t('inventoryDescription') || 'Set your current stock and preferences'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Inventory Management */}
                <View className="mb-8">
                    <Text className={`text-sm font-medium mb-4 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        📦 {t('inventoryManagement') || 'Inventory Management'}
                    </Text>

                    {/* Inventory Unit Selection */}
                    <View className="mb-4">
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('unit') || 'Unit'}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {commonInventoryUnits
                                    .filter(unit => !formData.form || unit.forms.includes(formData.form))
                                    .map((unit) => (
                                        <TouchableOpacity
                                            key={unit.value}
                                            onPress={() => selectUnit(unit.value)}
                                            className={`px-4 py-2 rounded-xl border ${
                                                formData.inventoryUnit === unit.value
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                            }`}
                                        >
                                            <Text className={`font-medium ${
                                                formData.inventoryUnit === unit.value
                                                    ? 'text-indigo-500'
                                                    : isDark ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                                {unit.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Total Inventory */}
                    <View className="mb-4">
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('totalInventory') || 'Total Inventory'}
                        </Text>

                        {/* Common Amounts */}
                        <View className="flex-row flex-wrap gap-2 mb-3">
                            {commonInventoryAmounts.map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    onPress={() => selectCommonAmount(amount)}
                                    className={`px-4 py-2 rounded-xl border ${
                                        formData.totalInventory === amount
                                            ? 'border-green-500 bg-green-500/10'
                                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                    }`}
                                >
                                    <Text className={`font-medium ${
                                        formData.totalInventory === amount
                                            ? 'text-green-500'
                                            : isDark ? 'text-slate-200' : 'text-gray-700'
                                    }`}>
                                        {amount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Amount */}
                        <View className="flex-row items-center">
                            <TextInput
                                value={formData.totalInventory.toString()}
                                onChangeText={updateTotalInventory}
                                className={`flex-1 px-4 py-3 rounded-xl border ${
                                    isDark
                                        ? 'bg-slate-800 border-slate-600 text-slate-100'
                                        : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                keyboardType="numeric"
                                placeholder={t('enterAmount') || 'Enter amount'}
                                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            />
                            <Text className={`ml-3 font-medium ${
                                isDark ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                                {formData.inventoryUnit}
                            </Text>
                        </View>
                    </View>

                    {/* Current Inventory */}
                    <View className="mb-4">
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('currentInventory') || 'Current Inventory'}
                        </Text>
                        <View className="flex-row items-center">
                            <TextInput
                                value={formData.currentInventory.toString()}
                                onChangeText={updateCurrentInventory}
                                className={`flex-1 px-4 py-3 rounded-xl border ${
                                    isDark
                                        ? 'bg-slate-800 border-slate-600 text-slate-100'
                                        : 'bg-white border-gray-300 text-gray-800'
                                }`}
                                keyboardType="numeric"
                                placeholder={t('enterCurrentAmount') || 'Current amount'}
                                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                            />
                            <Text className={`ml-3 font-medium ${
                                isDark ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                                {formData.inventoryUnit}
                            </Text>
                        </View>

                        {/* Progress Bar */}
                        <View className={`mt-2 h-2 rounded-full ${
                            isDark ? 'bg-slate-700' : 'bg-gray-200'
                        }`}>
                            <View
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${getInventoryPercentage()}%` }}
                            />
                        </View>
                        <Text className={`text-xs mt-1 ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                            {getInventoryPercentage()}% ({formData.currentInventory}/{formData.totalInventory} {formData.inventoryUnit})
                        </Text>
                    </View>

                    {/* Auto Deduct Toggle */}
                    <View className={`flex-row items-center justify-between p-4 rounded-xl ${
                        isDark ? 'bg-slate-800' : 'bg-gray-50'
                    }`}>
                        <View className="flex-1">
                            <Text className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {t('autoDeductInventory') || 'Auto-deduct inventory'}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('autoDeductDescription') || 'Automatically reduce count when taken'}
                            </Text>
                        </View>
                        <Switch
                            value={formData.autoDeductInventory}
                            onValueChange={toggleAutoDeduct}
                            trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#6366F1' }}
                            thumbColor={formData.autoDeductInventory ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>
                </View>

                {/* Notification Settings */}
                <View className="mb-8">
                    <Text className={`text-sm font-medium mb-4 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        🔔 {t('notificationSettings') || 'Notification Settings'}
                    </Text>

                    {/* Enable Notifications */}
                    <View className={`flex-row items-center justify-between p-4 rounded-xl mb-4 ${
                        isDark ? 'bg-slate-800' : 'bg-gray-50'
                    }`}>
                        <View className="flex-1">
                            <Text className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {t('enableNotifications') || 'Enable notifications'}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('notificationDescription') || 'Get reminders to take your medicine'}
                            </Text>
                        </View>
                        <Switch
                            value={formData.notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#6366F1' }}
                            thumbColor={formData.notificationsEnabled ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {/* Missed Dose Threshold */}
                    {formData.notificationsEnabled && (
                        <View className="mb-4">
                            <Text className={`text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                                {t('missedDoseThreshold') || 'Mark as missed after'}
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {reminderThresholds.map((threshold) => (
                                    <TouchableOpacity
                                        key={threshold.value}
                                        onPress={() => selectReminderThreshold(threshold.value)}
                                        className={`px-4 py-2 rounded-xl border ${
                                            formData.missedDoseThresholdMinutes === threshold.value
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        <Text className={`font-medium ${
                                            formData.missedDoseThresholdMinutes === threshold.value
                                                ? 'text-orange-500'
                                                : isDark ? 'text-slate-200' : 'text-gray-700'
                                        }`}>
                                            {threshold.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Late Intake Settings */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-4 ${
                        isDark ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                        ⏰ {t('lateIntakeSettings') || 'Late Intake Settings'}
                    </Text>

                    {/* Allow Late Intake */}
                    <View className={`flex-row items-center justify-between p-4 rounded-xl mb-4 ${
                        isDark ? 'bg-slate-800' : 'bg-gray-50'
                    }`}>
                        <View className="flex-1">
                            <Text className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-800'
                            }`}>
                                {t('allowLateIntake') || 'Allow late intake'}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                {t('lateIntakeDescription') || 'Allow taking medicine after scheduled time'}
                            </Text>
                        </View>
                        <Switch
                            value={formData.allowLateIntake}
                            onValueChange={toggleLateIntake}
                            trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#6366F1' }}
                            thumbColor={formData.allowLateIntake ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {/* Late Intake Window */}
                    {formData.allowLateIntake && (
                        <View>
                            <Text className={`text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                                {t('lateIntakeWindow') || 'Allow taking up to'}
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {lateIntakeWindows.map((window) => (
                                    <TouchableOpacity
                                        key={window.value}
                                        onPress={() => selectLateWindow(window.value)}
                                        className={`px-4 py-2 rounded-xl border ${
                                            formData.lateIntakeWindowHours === window.value
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        <Text className={`font-medium ${
                                            formData.lateIntakeWindowHours === window.value
                                                ? 'text-purple-500'
                                                : isDark ? 'text-slate-200' : 'text-gray-700'
                                        }`}>
                                            {window.label} late
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Summary */}
                <View className={`p-4 rounded-xl ${
                    isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                    <View className="flex-row items-start">
                        <AlertCircle size={20} color="#3B82F6" style={{ marginRight: 12, marginTop: 2 }} />
                        <View className="flex-1">
                            <Text className={`font-semibold mb-2 ${
                                isDark ? 'text-blue-300' : 'text-blue-800'
                            }`}>
                                {t('inventorySummary') || 'Inventory Summary'}
                            </Text>
                            <Text className={`text-sm ${
                                isDark ? 'text-blue-300' : 'text-blue-700'
                            }`}>
                                • Late intake: {formData.allowLateIntake ? `Up to ${formData.lateIntakeWindowHours}h late` : 'Not allowed'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default InventoryStep;