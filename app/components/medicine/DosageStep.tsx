import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform
} from 'react-native';
import { Plus, Trash2, Clock, AlertCircle } from 'lucide-react-native';
import { IntakeSchedule } from '@/app/services/medicine/medicine/MedicineServiceTypes';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from "@/app/context/LanguageContext";
import { useTheme } from "@/app/context/ThemeContext";

interface DosageStepProps {
    formData: any;
    updateFormData: (updates: any) => void;
    allowCustomTimes?: boolean;
}

const DosageStep: React.FC<DosageStepProps> = ({
                                                   formData,
                                                   updateFormData,
                                                   allowCustomTimes = true
                                               }) => {
    const { theme, isDark } = useTheme();
    const { t, isRTL } = useLanguage();
    const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
    const [customTime, setCustomTime] = useState('08:00');
    const [customAmount, setCustomAmount] = useState('1');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerMode, setTimePickerMode] = useState<'new' | 'edit' | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const frequencyPresets = [
        {
            label: t('onceDaily'),
            schedules: [{ time: '08:00', amount: 1 }],
            description: t('onceDailyDesc')
        },
        {
            label: t('twiceDaily'),
            schedules: [
                { time: '08:00', amount: 1 },
                { time: '20:00', amount: 1 }
            ],
            description: t('twiceDailyDesc')
        },
        {
            label: t('thriceDaily'),
            schedules: [
                { time: '08:00', amount: 1 },
                { time: '14:00', amount: 1 },
                { time: '20:00', amount: 1 }
            ],
            description: t('thriceDailyDesc')
        },
        {
            label: t('every8Hours'),
            schedules: [
                { time: '06:00', amount: 1 },
                { time: '14:00', amount: 1 },
                { time: '22:00', amount: 1 }
            ],
            description: t('every8HoursDesc')
        },
    ];

    const formatTime12Hour = (time24: string): string => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formatTime24Hour = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const timeString = formatTime24Hour(selectedDate);

            if (timePickerMode === 'new') {
                setCustomTime(timeString);
            } else if (timePickerMode === 'edit' && editingIndex !== null) {
                updateSchedule(editingIndex, 'time', timeString);
            }
        }
    };

    const openTimePicker = (mode: 'new' | 'edit', index?: number) => {
        Haptics.selectionAsync();
        setTimePickerMode(mode);

        if (mode === 'edit' && index !== undefined) {
            setEditingIndex(index);
        }

        setShowTimePicker(true);
    };

    const addCustomSchedule = () => {
        if (!customTime || !customAmount) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                t('error'),
                t('enterTimeAndAmount'),
                [{ text: t('ok') }]
            );
            return;
        }

        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                t('error'),
                t('enterValidAmount'),
                [{ text: t('ok') }]
            );
            return;
        }

        const timeExists = formData.intakeSchedules.some((schedule: IntakeSchedule) =>
            schedule.time === customTime
        );

        if (timeExists) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                t('duplicateTime'),
                t('duplicateTimeMessage'),
                [{ text: t('ok') }]
            );
            return;
        }

        const newSchedule: IntakeSchedule = {
            time: customTime,
            amount: amount
        };

        const updatedSchedules = [...formData.intakeSchedules, newSchedule].sort((a, b) =>
            a.time.localeCompare(b.time)
        );

        const updatedTimes = updatedSchedules.map(schedule => schedule.time);

        updateFormData({
            intakeSchedules: updatedSchedules,
            intakeTimes: updatedTimes
        });

        setCustomTime('08:00');
        setCustomAmount('1');
        setShowCustomTimeInput(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const removeSchedule = (index: number) => {
        Haptics.selectionAsync();
        const updatedSchedules = formData.intakeSchedules.filter((_: any, i: number) => i !== index);
        const updatedTimes = updatedSchedules.map((schedule: IntakeSchedule) => schedule.time);

        updateFormData({
            intakeSchedules: updatedSchedules,
            intakeTimes: updatedTimes
        });
    };

    const updateSchedule = (index: number, field: 'time' | 'amount', value: string) => {
        const updatedSchedules = [...formData.intakeSchedules];

        if (field === 'time') {
            const timeExists = updatedSchedules.some((schedule, i) =>
                i !== index && schedule.time === value
            );

            if (timeExists) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(
                    t('duplicateTime'),
                    t('duplicateTimeMessage'),
                    [{ text: t('ok') }]
                );
                return;
            }

            updatedSchedules[index].time = value;
        } else if (field === 'amount') {
            updatedSchedules[index].amount = value;
        }

        updatedSchedules.sort((a, b) => a.time.localeCompare(b.time));
        const updatedTimes = updatedSchedules.map(schedule => schedule.time);

        updateFormData({
            intakeSchedules: updatedSchedules,
            intakeTimes: updatedTimes
        });
    };

    const handleAmountBlur = (index: number, value: string) => {
        const updatedSchedules = [...formData.intakeSchedules];
        const amount = parseFloat(value);

        if (isNaN(amount) || amount <= 0 || value === '') {
            updatedSchedules[index].amount = 1;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
            updatedSchedules[index].amount = amount;
        }

        updateFormData({
            intakeSchedules: updatedSchedules,
            intakeTimes: updatedSchedules.map(schedule => schedule.time)
        });
    };

    const applyPreset = (preset: typeof frequencyPresets[0]) => {
        Haptics.selectionAsync();
        updateFormData({
            intakeSchedules: preset.schedules,
            intakeTimes: preset.schedules.map(s => s.time)
        });
    };

    const totalDoses = formData.intakeSchedules.reduce((sum: number, schedule: IntakeSchedule) =>
        sum + (typeof schedule.amount === 'string' ? parseFloat(schedule.amount) || 0 : schedule.amount), 0);

    return (
        <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 30 }}
            style={{ backgroundColor: theme.background }}
        >
            <View className="mb-6">
                <Text
                    className="text-2xl font-bold mb-2"
                    style={{ color: theme.text }}
                >
                    {t('dosage')}
                </Text>
                <Text
                    className="text-base"
                    style={{ color: theme.textSecondary }}
                >
                    {allowCustomTimes ? t('setMedicationSchedule') : t('chooseWhenAndHowMuch')}
                </Text>
            </View>

            {formData.intakeSchedules.length > 0 && (
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text
                            className="text-lg font-semibold"
                            style={{ color: theme.text }}
                        >
                            {t('yourSchedule')}
                        </Text>
                        <View className="flex-row items-center">
                            <Text
                                className="text-sm mr-2"
                                style={{ color: theme.textSecondary }}
                            >
                                {t('total')}:
                            </Text>
                            <View
                                className="px-2 py-1 rounded-full"
                                style={{ backgroundColor: theme.primary + '22' }}
                            >
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: theme.primary }}
                                >
                                    {totalDoses} {t('dosesDaily')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="space-y-3">
                        {formData.intakeSchedules.map((schedule: IntakeSchedule, index: number) => (
                            <View
                                key={index}
                                className="p-4 rounded-2xl border mb-2"
                                style={{
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                                            style={{ backgroundColor: theme.surface }}
                                        >
                                            <Clock size={18} color={theme.textSecondary} />
                                        </View>
                                        <View>
                                            <Text
                                                className="font-medium"
                                                style={{ color: theme.text }}
                                            >
                                                {formatTime12Hour(schedule.time)}
                                            </Text>
                                            <Text
                                                className="text-xs"
                                                style={{ color: theme.textSecondary }}
                                            >
                                                {schedule.amount} {t('doses')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center space-x-2">
                                        <TouchableOpacity
                                            onPress={() => removeSchedule(index)}
                                            className="p-2"
                                        >
                                            <Trash2 size={18} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="flex-row mt-4 space-x-3">
                                    <View className="flex-1">
                                        <Text
                                            className="text-xs mb-1"
                                            style={{ color: theme.textSecondary }}
                                        >
                                            {t('time')}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => openTimePicker('edit', index)}
                                            className="px-3 py-2 rounded-lg border"
                                            style={{
                                                borderColor: theme.border,
                                                backgroundColor: theme.surface,
                                                marginRight: 4
                                            }}
                                        >
                                            <Text
                                                className="text-base font-medium"
                                                style={{ color: theme.text }}
                                            >
                                                {formatTime12Hour(schedule.time)}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="w-24">
                                        <Text
                                            className="text-xs mb-1"
                                            style={{ color: theme.textSecondary }}
                                        >
                                            {t('amount')}
                                        </Text>
                                        <TextInput
                                            value={schedule.amount.toString()}
                                            onChangeText={(value) => updateSchedule(index, 'amount', value)}
                                            onBlur={() => handleAmountBlur(index, schedule.amount.toString())}
                                            placeholder="1"
                                            keyboardType="numeric"
                                            className="text-base font-medium px-3 py-2 rounded-lg border text-center"
                                            style={{
                                                color: theme.text,
                                                backgroundColor: theme.surface,
                                                borderColor: theme.border,
                                            }}
                                            placeholderTextColor={theme.textSecondary}
                                            selectTextOnFocus={true}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {allowCustomTimes && (
                <View className="mb-6">
                    {!showCustomTimeInput ? (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.selectionAsync();
                                setShowCustomTimeInput(true);
                            }}
                            className="flex-row items-center justify-center p-4 rounded-2xl border"
                            style={{
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                            }}
                            activeOpacity={0.8}
                        >
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                                style={{ backgroundColor: theme.surface }}
                            >
                                <Plus size={18} color={theme.textSecondary} />
                            </View>
                            <Text
                                className="font-medium"
                                style={{ color: theme.text }}
                            >
                                {t('addCustomTime')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View
                            className="p-5 rounded-2xl border"
                            style={{
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                            }}
                        >
                            <Text
                                className="text-lg font-semibold mb-3"
                                style={{ color: theme.text }}
                            >
                                {t('addMedicationTime')}
                            </Text>

                            <View className="space-y-5">
                                <View>
                                    <Text
                                        className="text-sm font-medium mb-2"
                                        style={{ color: theme.text }}
                                    >
                                        {t('timeLabel')}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setTimePickerMode('new');
                                            setShowTimePicker(true);
                                        }}
                                        className="px-4 py-3 rounded-lg border"
                                        style={{
                                            borderColor: theme.border,
                                            backgroundColor: theme.surface,
                                        }}
                                    >
                                        <Text
                                            className="text-base"
                                            style={{ color: theme.text }}
                                        >
                                            {formatTime12Hour(customTime)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View>
                                    <Text
                                        className="text-sm font-medium mb-2"
                                        style={{ color: theme.text }}
                                    >
                                        {t('amountDoses')}
                                    </Text>
                                    <TextInput
                                        value={customAmount}
                                        onChangeText={setCustomAmount}
                                        placeholder="1"
                                        keyboardType="numeric"
                                        className="text-base px-4 py-3 rounded-lg border"
                                        style={{
                                            color: theme.text,
                                            backgroundColor: theme.card,
                                            borderColor: theme.border,
                                        }}
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>

                                <View className="flex-row space-x-3">
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setShowCustomTimeInput(false);
                                            setCustomTime('08:00');
                                            setCustomAmount('1');
                                        }}
                                        className="flex-1 py-3 rounded-lg border"
                                        style={{
                                            borderColor: theme.border,
                                            backgroundColor: theme.surface,
                                        }}
                                    >
                                        <Text
                                            className="text-center font-medium"
                                            style={{ color: theme.text }}
                                        >
                                            {t('cancel')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={addCustomSchedule}
                                        className="flex-1 py-3 rounded-lg"
                                        style={{ backgroundColor: theme.primary }}
                                    >
                                        <Text
                                            className="text-center font-medium"
                                            style={{ color: theme.card }}
                                        >
                                            {t('addTime')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            )}

            <View className="mb-6">
                <Text
                    className="text-lg font-semibold mb-3"
                    style={{ color: theme.text }}
                >
                    {t('quickSetup')}
                </Text>

                <View className="flex-row flex-wrap justify-between gap-3">
                    {frequencyPresets.map((preset, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => applyPreset(preset)}
                            className="w-[48%] p-4 rounded-xl border"
                            style={{
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                            }}
                            activeOpacity={0.8}
                        >
                            <Text
                                className="font-medium text-center"
                                style={{ color: theme.text }}
                            >
                                {preset.label}
                            </Text>
                            <Text
                                className="text-xs text-center mt-1"
                                style={{ color: theme.textSecondary }}
                            >
                                {preset.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View
                className="p-4 rounded-2xl border"
                style={{
                    backgroundColor: theme.primary + '22',
                    borderColor: theme.primary + '33'
                }}
            >
                <View className="flex-row items-start">
                    <AlertCircle size={16} color={theme.primary} className="mt-0.5 mr-2" />
                    <View className="flex-1">
                        <Text
                            className="text-sm font-medium mb-1"
                            style={{ color: theme.primary }}
                        >
                            {t('tipsForSettingTimes')}
                        </Text>
                        <Text
                            className="text-xs leading-relaxed"
                            style={{ color: theme.primary }}
                        >
                            {t('dosageTips')}
                        </Text>
                    </View>
                </View>
            </View>
            {showTimePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                    onChange={handleTimeChange}
                    is24Hour={false}
                    themeVariant={isDark ? 'dark' : 'light'}
                />
            )}
        </ScrollView>
    );
};

export default DosageStep;