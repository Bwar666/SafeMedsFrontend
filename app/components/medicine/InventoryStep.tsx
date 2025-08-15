import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { Package, AlertCircle, Bell, Info } from 'lucide-react-native';
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";

interface InventoryStepProps {
    formData: any;
    updateFormData: (updates: any) => void;
}

const InventoryStep: React.FC<InventoryStepProps> = ({
                                                         formData,
                                                         updateFormData,
                                                     }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

    const [enableInventory, setEnableInventory] = useState(
        formData.currentInventory !== null || formData.totalInventory !== null
    );

    const handleEnableInventory = (enabled: boolean) => {
        setEnableInventory(enabled);

        if (enabled) {
            updateFormData({
                currentInventory: formData.currentInventory || 30,
                totalInventory: formData.totalInventory || 30,
                autoDeductInventory: formData.autoDeductInventory = true,
                refillReminderThreshold: formData.refillReminderThreshold || 5,
            });
        } else {
            updateFormData({
                currentInventory: null,
                totalInventory: null,
                autoDeductInventory: false,
                refillReminderThreshold: null,
            });
        }
    };

    const updateInventoryField = (field: string, value: any) => {
        updateFormData({ [field]: value });
    };

    const validateInventory = () => {
        if (!enableInventory) return true;

        const current = formData.currentInventory || 0;
        const total = formData.totalInventory || 0;

        return current >= 0 && total >= current && total > 0;
    };

    const getCurrentInventoryPercentage = () => {
        if (!enableInventory || !formData.totalInventory || formData.totalInventory === 0) return 0;
        return Math.round((formData.currentInventory / formData.totalInventory) * 100);
    };

    const getInventoryStatusColor = () => {
        const percentage = getCurrentInventoryPercentage();
        const threshold = ((formData.refillReminderThreshold || 5) / (formData.totalInventory || 30)) * 100;

        if (percentage <= threshold) return theme.error;
        if (percentage <= 25) return theme.warning;
        return theme.success;
    };

    return (
        <ScrollView className="flex-1 px-4">
            {/* Header */}
            <View className="mb-6">
                <Text style={{ color: theme.text }} className="text-2xl font-bold mb-2">
                    {t('inventoryTracking') || 'Inventory Tracking'}
                </Text>
                <Text style={{ color: theme.textSecondary }} className="text-base">
                    {t('inventoryDescription') || 'Track your medicine supply and get refill reminders (Optional)'}
                </Text>
            </View>

            {/* Enable/Disable Toggle */}
            <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        <Package size={24} color={theme.textSecondary} />
                        <View className="ml-3 flex-1">
                            <Text style={{ color: theme.text }} className="text-lg font-semibold">
                                {t('enableInventoryTracking') || 'Enable Inventory Tracking'}
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="text-sm">
                                {t('trackPillsAndAlerts') || 'Track remaining pills and get low stock alerts'}
                            </Text>
                        </View>
                    </View>

                    <Switch
                        value={enableInventory}
                        onValueChange={handleEnableInventory}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={enableInventory ? '#ffffff' : theme.textSecondary}
                    />
                </View>

                {!enableInventory && (
                    <View style={{ backgroundColor: theme.surface }} className="mt-3 p-3 rounded-lg">
                        <Text style={{ color: theme.textSecondary }} className="text-sm">
                            {t('skipInventoryMessage') || 'You can skip inventory tracking and add it later in settings if needed.'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Inventory Settings - Only show if enabled */}
            {enableInventory && (
                <>
                    {/* Current & Total Inventory */}
                    <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                        <Text style={{ color: theme.text }} className="text-lg font-semibold mb-4">
                            {t('inventoryDetails') || 'Inventory Details'}
                        </Text>

                        <View className="space-y-4">
                            {/* Current Inventory */}
                            <View>
                                <Text style={{ color: theme.text }} className="text-sm font-medium mb-2">
                                    {t('currentAmount') || 'Current Amount'}
                                </Text>
                                <TextInput
                                    value={formData.currentInventory?.toString() || ''}
                                    onChangeText={(value) => {
                                        const num = parseInt(value) || 0;
                                        updateInventoryField('currentInventory', num);
                                    }}
                                    placeholder="30"
                                    keyboardType="numeric"
                                    style={{
                                        color: theme.text,
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border
                                    }}
                                    className="text-base px-4 py-3 rounded-lg border"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            {/* Total Inventory */}
                            <View>
                                <Text style={{ color: theme.text }} className="text-sm font-medium mb-2">
                                    {t('fullBottleAmount') || 'Full Bottle/Pack Amount'}
                                </Text>
                                <TextInput
                                    value={formData.totalInventory?.toString() || ''}
                                    onChangeText={(value) => {
                                        const num = parseInt(value) || 0;
                                        updateInventoryField('totalInventory', num);
                                        if (formData.currentInventory > num) {
                                            updateInventoryField('currentInventory', num);
                                        }
                                    }}
                                    placeholder="30"
                                    keyboardType="numeric"
                                    style={{
                                        color: theme.text,
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border
                                    }}
                                    className="text-base px-4 py-3 rounded-lg border"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Inventory Visual */}
                        {formData.totalInventory > 0 && (
                            <View className="mt-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text style={{ color: theme.text }} className="text-sm font-medium">
                                        {t('currentStock') || 'Current Stock'}
                                    </Text>
                                    <Text style={{ color: getInventoryStatusColor() }} className="text-sm font-bold">
                                        {formData.currentInventory || 0} / {formData.totalInventory} ({getCurrentInventoryPercentage()}%)
                                    </Text>
                                </View>

                                <View style={{ backgroundColor: theme.border }} className="h-2 rounded-full">
                                    <View
                                        style={{
                                            backgroundColor: getCurrentInventoryPercentage() <= 20
                                                ? theme.error
                                                : getCurrentInventoryPercentage() <= 50
                                                    ? theme.warning
                                                    : theme.success,
                                            width: `${getCurrentInventoryPercentage()}%`
                                        }}
                                        className="h-full rounded-full"
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Refill Reminder */}
                    <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-4 rounded-xl border mb-6">
                        <View className="flex-row items-center mb-4">
                            <Bell size={20} color={theme.textSecondary} />
                            <Text style={{ color: theme.text }} className="text-lg font-semibold ml-3">
                                {t('refillReminder') || 'Refill Reminder'}
                            </Text>
                        </View>

                        <View>
                            <Text style={{ color: theme.text }} className="text-sm font-medium mb-2">
                                {t('alertWhenLeft') || `Alert me when I have this many ${formData.inventoryUnit} left`}
                            </Text>
                            <TextInput
                                value={formData.refillReminderThreshold?.toString() || ''}
                                onChangeText={(value) => {
                                    const num = parseInt(value) || 0;
                                    updateInventoryField('refillReminderThreshold', num);
                                }}
                                placeholder="5"
                                keyboardType="numeric"
                                style={{
                                    color: theme.text,
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border
                                }}
                                className="text-base px-4 py-3 rounded-lg border"
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={{ color: theme.textSecondary }} className="text-xs mt-2">
                                {t('notificationAtLevel') || 'You\'ll get a notification when your supply reaches this level'}
                            </Text>
                        </View>
                    </View>
                </>
            )}

            {/* Info Box */}
            <View style={{ backgroundColor: `${theme.primary}20` }} className="p-4 rounded-xl">
                <View className="flex-row items-start">
                    <Info size={16} color={theme.primary} />
                    <View className="ml-3 flex-1">
                        <Text style={{ color: theme.primary }} className="text-sm font-medium mb-1">
                            {enableInventory ? (t('inventoryBenefits') || 'Inventory Tracking Benefits') : (t('whyTrackInventory') || 'Why Track Inventory?')}
                        </Text>
                        <Text style={{ color: theme.primary }} className="text-xs leading-relaxed">
                            {enableInventory ? (
                                t('inventoryBenefitsList') || '• Never run out of medicine unexpectedly\n• Get timely refill reminders\n• Track your medicine usage patterns\n• Automatic inventory updates when you take doses'
                            ) : (
                                t('inventoryTrackingHelps') || 'Inventory tracking helps you:\n• Stay ahead of refills\n• Never miss doses due to empty bottles\n• Track usage patterns\nYou can always enable this later in settings'
                            )}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Validation Error */}
            {enableInventory && !validateInventory() && (
                <View style={{ backgroundColor: `${theme.error}20` }} className="mt-4 p-4 rounded-xl">
                    <View className="flex-row items-start">
                        <AlertCircle size={16} color={theme.error} />
                        <View className="ml-3 flex-1">
                            <Text style={{ color: theme.error }} className="text-sm font-medium">
                                {t('checkInventoryAmounts') || 'Please check your inventory amounts'}
                            </Text>
                            <Text style={{ color: theme.error }} className="text-xs mt-1">
                                {t('inventoryValidationMessage') || 'Current amount cannot be greater than total amount, and both must be positive numbers.'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

export default InventoryStep;