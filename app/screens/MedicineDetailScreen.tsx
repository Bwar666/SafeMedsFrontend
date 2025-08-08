import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { X, Edit2, Trash2, Clock, Calendar, AlertTriangle, Info, PlayCircle, PauseCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserStorageService } from '../services/user/UserService';
// CORRECTED IMPORT PATHS:
import { medicineUsageService } from '../services/medicine/usage/MedicineUsageService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
// CORRECTED IMPORT PATHS:
import {
    FoodInstruction,
    FrequencyType,
    MedicineForm,
    MedicineResponse
} from '../services/medicine/medicine/MedicineServiceTypes';
import { medicineService } from '../services/medicine/medicine/MedicineService';

type MedicineDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MedicineDetail'>;
type MedicineDetailScreenRouteProp = RouteProp<RootStackParamList, 'MedicineDetail'>;

interface MedicineDetailScreenProps {
    navigation: MedicineDetailScreenNavigationProp;
    route: MedicineDetailScreenRouteProp;
}
// Detail Section Component
const DetailSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isDark: boolean;
}> = ({ title, icon, children, isDark }) => (
    <View className={`mb-6 p-4 rounded-xl ${
        isDark ? 'bg-slate-800' : 'bg-gray-50'
    }`}>
        <View className="flex-row items-center mb-3">
            {icon}
            <Text className={`ml-2 text-lg font-semibold ${
                isDark ? 'text-slate-100' : 'text-gray-800'
            }`}>
                {title}
            </Text>
        </View>
        {children}
    </View>
);

// Detail Row Component
const DetailRow: React.FC<{
    label: string;
    value: string | React.ReactNode;
    isDark: boolean;
    highlight?: boolean;
}> = ({ label, value, isDark, highlight = false }) => (
    <View className="flex-row justify-between items-center py-2">
        <Text className={`flex-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {label}:
        </Text>
        <View className="flex-2 items-end">
            {typeof value === 'string' ? (
                <Text className={`font-medium text-right ${
                    highlight
                        ? 'text-indigo-500'
                        : isDark ? 'text-slate-100' : 'text-gray-800'
                }`}>
                    {value}
                </Text>
            ) : (
                value
            )}
        </View>
    </View>
);

const MedicineDetailScreen: React.FC<MedicineDetailScreenProps> = ({ navigation, route }) => {
    const { medicineId } = route.params as { medicineId: string };

    const { isDark } = useTheme();
    const { t, isRTL } = useLanguage();
    const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch medicine details
    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const user = await UserStorageService.getStoredUser();
                if (!user) {
                    throw new Error('User not found');
                }

                const med = await medicineService.getMedicineById(user.id, medicineId);
                setMedicine(med);
            } catch (error) {
                console.error('Error fetching medicine:', error);
                Alert.alert(t('error') || 'Error', t('fetchError') || 'Failed to load medicine details');
            } finally {
                setLoading(false);
            }
        };

        fetchMedicine();
    }, [medicineId]);

    const getFormIcon = (form: MedicineForm) => {
        const icons = {
            [MedicineForm.PILL]: '💊',
            [MedicineForm.CAPSULE]: '🔴',
            [MedicineForm.TABLET]: '⚪',
            [MedicineForm.INJECTION]: '💉',
            [MedicineForm.LIQUID]: '🧴',
            [MedicineForm.DROPS]: '💧',
            [MedicineForm.INHALER]: '🫁',
            [MedicineForm.POWDER]: '🥄',
            [MedicineForm.PATCH]: '🩹',
            [MedicineForm.GEL]: '🧴',
            [MedicineForm.SPRAY]: '💨',
            [MedicineForm.OTHER]: '❓',
        };
        return icons[form] || '💊';
    };

    const getFormDisplayName = (form: MedicineForm) => {
        const formNames = {
            [MedicineForm.PILL]: t('pill') || 'Pill',
            [MedicineForm.CAPSULE]: t('capsule') || 'Capsule',
            [MedicineForm.TABLET]: t('tablet') || 'Tablet',
            [MedicineForm.INJECTION]: t('injection') || 'Injection',
            [MedicineForm.LIQUID]: t('liquid') || 'Liquid',
            [MedicineForm.DROPS]: t('drops') || 'Drops',
            [MedicineForm.INHALER]: t('inhaler') || 'Inhaler',
            [MedicineForm.POWDER]: t('powder') || 'Powder',
            [MedicineForm.PATCH]: t('patch') || 'Patch',
            [MedicineForm.GEL]: t('gel') || 'Gel',
            [MedicineForm.SPRAY]: t('spray') || 'Spray',
            [MedicineForm.OTHER]: t('other') || 'Other',
        };
        return formNames[form] || form;
    };

    const getFrequencyDisplayName = (frequency: FrequencyType) => {
        const frequencyNames = {
            [FrequencyType.DAILY]: t('daily') || 'Daily',
            [FrequencyType.EVERY_OTHER_DAY]: t('everyOtherDay') || 'Every Other Day',
            [FrequencyType.SPECIFIC_DAYS_OF_WEEK]: t('specificDays') || 'Specific Days',
            [FrequencyType.EVERY_X_DAYS]: t('everyXDays') || 'Every X Days',
            [FrequencyType.EVERY_X_WEEKS]: t('everyXWeeks') || 'Every X Weeks',
            [FrequencyType.EVERY_X_MONTHS]: t('everyXMonths') || 'Every X Months',
            [FrequencyType.CYCLE_BASED]: t('cycleBased') || 'Cycle Based',
        };
        return frequencyNames[frequency] || frequency;
    };

    const getFoodInstructionDisplayName = (instruction: FoodInstruction) => {
        const instructionNames = {
            [FoodInstruction.BEFORE_EATING]: t('beforeEating') || 'Before Eating',
            [FoodInstruction.WHILE_EATING]: t('whileEating') || 'With Food',
            [FoodInstruction.AFTER_EATING]: t('afterEating') || 'After Eating',
            [FoodInstruction.EMPTY_STOMACH]: t('emptyStomach') || 'Empty Stomach',
            [FoodInstruction.DOES_NOT_MATTER]: t('doesNotMatter') || 'Anytime',
        };
        return instructionNames[instruction] || instruction;
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const handleDelete = () => {
        if (!medicine) return;

        Alert.alert(
            t('deleteMedicine') || 'Delete Medicine',
            `${t('confirmDelete') || 'Are you sure you want to delete'} "${medicine.name}"?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = await UserStorageService.getStoredUser();
                            if (!user) throw new Error('User not found');

                            await medicineService.deleteMedicine(user.id, medicine.id);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting medicine:', error);
                            Alert.alert(t('error') || 'Error', t('deleteError') || 'Failed to delete medicine');
                        }
                    },
                },
            ]
        );
    };

    const handleTogglePause = async () => {
        if (!medicine) return;

        try {
            const user = await UserStorageService.getStoredUser();
            if (!user) throw new Error('User not found');

            if (medicine.isActive) {
                // Pause the medicine
                await medicineUsageService.pauseMedicine(
                    user.id,
                    medicine.id,
                    {
                        pauseReason: 'User manually paused',
                        pauseNotifications: true
                    }
                );
            } else {
                // Resume the medicine
                await medicineUsageService.resumeMedicine(user.id, medicine.id);
            }

            // Fetch updated medicine data
            const updatedMedicine = await medicineService.getMedicineById(user.id, medicine.id);
            setMedicine(updatedMedicine);
        } catch (error) {
            console.error('Error toggling medicine status:', error);
            Alert.alert(t('error') || 'Error', t('toggleError') || 'Failed to update medicine status');
        }
    };

    const handleEdit = () => {
        if (medicine) {
            navigation.navigate('EditMedicine', { medicineId: medicine.id });
        }
    };

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
                <ActivityIndicator size="large" color={isDark ? '#6366F1' : '#4F46E5'} />
            </View>
        );
    }

    if (!medicine) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
                <Text className={`text-lg ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('medicineNotFound') || 'Medicine not found'}
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className={`mt-4 px-6 py-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                >
                    <Text className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {t('goBack') || 'Go Back'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalDailyAmount = medicine.intakeSchedules.reduce((sum, schedule) => sum + schedule.amount, 0);

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Header */}
            <View className={`flex-row items-center justify-between p-4 border-b ${
                isDark ? 'border-slate-700' : 'border-gray-200'
            }`}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                </TouchableOpacity>

                <Text className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {medicine.name}
                </Text>

                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={handleEdit}
                        className="p-2 mr-2"
                        activeOpacity={0.7}
                    >
                        <Edit2 size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDelete}
                        className="p-2"
                        activeOpacity={0.7}
                    >
                        <Trash2 size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Medicine Overview */}
                <View className={`p-6 rounded-xl mb-6 relative overflow-hidden ${
                    isDark ? 'bg-slate-800' : 'bg-gray-50'
                }`} style={{ borderColor: medicine.color || '#6366F1', borderWidth: 2, borderStyle: 'solid' }}>
                    {/* Background Pattern */}
                    <View className="absolute top-0 right-0 opacity-5">
                        <Text className="text-8xl">{getFormIcon(medicine.form)}</Text>
                    </View>

                    <View className="items-center relative z-10">
                        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 shadow-lg`}
                              style={{ backgroundColor: medicine.color || '#6366F1' }}>
                            <Text className="text-4xl">{getFormIcon(medicine.form)}</Text>
                        </View>
                        <Text className={`text-2xl font-bold text-center mb-2 ${
                            isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}>
                            {medicine.name}
                        </Text>
                        {medicine.conditionReason && (
                            <Text className={`text-sm text-center mb-3 ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                                🎯 {t('for') || 'For'} {medicine.conditionReason}
                            </Text>
                        )}
                        <View className={`px-4 py-2 rounded-full shadow-sm ${
                            medicine.isActive
                                ? 'bg-green-500'
                                : 'bg-amber-500'
                        }`}>
                            <Text className="text-white font-semibold flex-row items-center">
                                {medicine.isActive ? '🟢 ' : '⏸️ '}
                                {medicine.isActive ? (t('active') || 'Active') : (t('paused') || 'Paused')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Basic Information */}
                <DetailSection
                    title={t('basicInformation') || 'Basic Information'}
                    icon={<Info size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                    isDark={isDark}
                >
                    <DetailRow
                        label={t('medicineName') || 'Medicine Name'}
                        value={medicine.name}
                        isDark={isDark}
                        highlight
                    />
                    <DetailRow
                        label={t('form') || 'Form'}
                        value={getFormDisplayName(medicine.form)}
                        isDark={isDark}
                    />
                    {medicine.conditionReason && (
                        <DetailRow
                            label={t('condition') || 'Condition'}
                            value={medicine.conditionReason}
                            isDark={isDark}
                        />
                    )}
                    {medicine.formattedDosage && (
                        <DetailRow
                            label={t('dosage') || 'Dosage'}
                            value={medicine.formattedDosage}
                            isDark={isDark}
                        />
                    )}
                </DetailSection>

                {/* Schedule Information */}
                <DetailSection
                    title={t('schedule') || 'Schedule'}
                    icon={<Clock size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                    isDark={isDark}
                >
                    <DetailRow
                        label={t('frequency') || 'Frequency'}
                        value={getFrequencyDisplayName(medicine.frequencyType)}
                        isDark={isDark}
                        highlight
                    />
                    <DetailRow
                        label={t('timesPerDay') || 'Times per day'}
                        value={medicine.intakeSchedules.length.toString()}
                        isDark={isDark}
                    />
                    <DetailRow
                        label={t('totalDailyAmount') || 'Total daily amount'}
                        value={totalDailyAmount.toString()}
                        isDark={isDark}
                    />

                    {/* Individual Intake Times */}
                    <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                        <Text className={`text-sm font-medium mb-2 ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                            {t('intakeTimes') || 'Intake Times'}:
                        </Text>
                        {medicine.intakeSchedules.map((schedule, index) => (
                            <View key={index} className="flex-row justify-between items-center py-1">
                                <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {formatTime(schedule.time)}
                                </Text>
                                <Text className={`font-medium ${
                                    isDark ? 'text-slate-100' : 'text-gray-800'
                                }`}>
                                    {schedule.amount} {schedule.amount === 1 ? 'dose' : 'doses'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </DetailSection>

                {/* Additional Information */}
                <DetailSection
                    title={t('additionalInfo') || 'Additional Information'}
                    icon={<Calendar size={20} color={isDark ? '#F8FAFC' : '#1F2937'} />}
                    isDark={isDark}
                >
                    {medicine.scheduleDuration && (
                        <DetailRow
                            label={t('duration') || 'Duration'}
                            value={medicine.scheduleDuration === 365
                                ? (t('ongoing') || 'Ongoing')
                                : `${medicine.scheduleDuration} ${medicine.scheduleDuration === 1 ? 'day' : 'days'}`
                            }
                            isDark={isDark}
                        />
                    )}
                    {medicine.refillReminderThreshold && (
                        <DetailRow
                            label={t('refillReminder') || 'Refill reminder'}
                            value={`${medicine.refillReminderThreshold} ${medicine.refillReminderThreshold === 1 ? 'day' : 'days'} before`}
                            isDark={isDark}
                        />
                    )}
                    {medicine.foodInstruction && (
                        <DetailRow
                            label={t('foodInstructions') || 'Food instructions'}
                            value={getFoodInstructionDisplayName(medicine.foodInstruction)}
                            isDark={isDark}
                        />
                    )}
                </DetailSection>

                {/* Allergies Warning */}
                {medicine.relatedAllergies && medicine.relatedAllergies.length > 0 && (
                    <View className={`p-4 rounded-xl mb-6 ${
                        isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                    }`}>
                        <View className="flex-row items-start">
                            <AlertTriangle size={20} color="#F59E0B" style={{ marginRight: 12, marginTop: 2 }} />
                            <View className="flex-1">
                                <Text className={`font-semibold mb-2 ${
                                    isDark ? 'text-amber-300' : 'text-amber-800'
                                }`}>
                                    {t('allergyWarning') || 'Allergy Warning'}
                                </Text>
                                {medicine.relatedAllergies.map((allergy, index) => (
                                    <View key={allergy.id} className="mb-1">
                                        <Text className={`text-sm font-medium ${
                                            isDark ? 'text-amber-300' : 'text-amber-700'
                                        }`}>
                                            • {allergy.name}
                                        </Text>
                                        {allergy.description && (
                                            <Text className={`text-xs ${
                                                isDark ? 'text-amber-400' : 'text-amber-600'
                                            } ml-3`}>
                                                {allergy.description}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Prominent Pause/Resume Button */}
                <View className="mb-6">
                    <TouchableOpacity
                        onPress={handleTogglePause}
                        className={`flex-row items-center justify-center p-6 rounded-2xl shadow-lg ${
                            medicine.isActive
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                        }`}
                        style={{ elevation: 4 }}
                        activeOpacity={0.8}
                    >
                        {medicine.isActive ? (
                            <PauseCircle size={32} color="white" />
                        ) : (
                            <PlayCircle size={32} color="white" />
                        )}
                        <Text className="text-white text-xl font-bold ml-4">
                            {medicine.isActive
                                ? (t('pauseMedicine') || '⏸️ Pause Treatment')
                                : (t('resumeMedicine') || '▶️ Resume Treatment')
                            }
                        </Text>
                    </TouchableOpacity>

                    <Text className={`text-center mt-2 text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                        {medicine.isActive
                            ? (t('pauseDescription') || 'Temporarily stop taking this medicine')
                            : (t('resumeDescription') || 'Continue your treatment schedule')
                        }
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default MedicineDetailScreen;