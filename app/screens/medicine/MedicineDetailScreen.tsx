import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
    Pressable,
    StyleSheet,
    Image
} from 'react-native';
import {
    X, MoreVertical, Clock, Calendar, AlertTriangle, Info,
    Pill, Edit3, Trash2, Pause, Play, Box, Bell, Package,
    BellOff, Check, X as XIcon, Clock as ClockIcon, Circle, Battery, BatteryCharging
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { medicineUsageService } from '../../services/medicine/usage/MedicineUsageService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
    FoodInstruction,
    FrequencyType,
    MedicineForm,
    MedicineResponse
} from '../../services/medicine/medicine/MedicineServiceTypes';
import { medicineService } from '../../services/medicine/medicine/MedicineService';
import { UserStorageService } from "@/app/services/user";
import { medicines } from '@/assets/images';
import {transparent} from "react-native-paper/lib/typescript/styles/themes/v2/colors";


type MedicineDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MedicineDetail'>;
type MedicineDetailScreenRouteProp = RouteProp<RootStackParamList, 'MedicineDetail'>;

interface MedicineDetailScreenProps {
    navigation: MedicineDetailScreenNavigationProp;
    route: MedicineDetailScreenRouteProp;
}

// Context Menu Component
const MedicineContextMenu: React.FC<{
    visible: boolean;
    medicine: MedicineResponse | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePause: () => void;
    isDark: boolean;
    t: (key: string) => string;
}> = ({ visible, medicine, onClose, onEdit, onDelete, onTogglePause, isDark, t }) => {
    const { theme } = useTheme();

    if (!medicine) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={onClose}
            >
                <View style={[{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: theme.card,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    padding: 16
                }]}>
                    <TouchableOpacity
                        style={[{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            backgroundColor: theme.surface,
                            borderRadius: 8
                        }]}
                        onPress={onEdit}
                    >
                        <Edit3 size={20} color={theme.textSecondary} />
                        <Text style={[{
                            marginLeft: 12,
                            fontSize: 16,
                            color: theme.text
                        }]}>
                            {t('editMedicine') || 'Edit Medicine'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            backgroundColor: theme.surface,
                            borderRadius: 8,
                            marginTop: 8
                        }]}
                        onPress={onTogglePause}
                    >
                        {medicine.isActive
                            ? <Pause size={20} color="#F59E0B" />
                            : <Play size={20} color="#10B981" />
                        }
                        <Text style={[{
                            marginLeft: 12,
                            fontSize: 16,
                            color: medicine.isActive ? '#F59E0B' : '#10B981'
                        }]}>
                            {medicine.isActive
                                ? (t('pauseMedicine') || 'Pause Medicine')
                                : (t('resumeMedicine') || 'Resume Medicine')
                            }
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            backgroundColor: theme.surface,
                            borderRadius: 8,
                            marginTop: 8
                        }]}
                        onPress={onDelete}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text style={[{
                            marginLeft: 12,
                            fontSize: 16,
                            color: '#EF4444'
                        }]}>
                            {t('deleteMedicine') || 'Delete Medicine'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[{
                            paddingVertical: 16,
                            borderRadius: 8,
                            alignItems: 'center',
                            backgroundColor: theme.surface,
                            marginTop: 16
                        }]}
                        onPress={onClose}
                    >
                        <Text style={[{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.textSecondary
                        }]}>
                            {t('cancel')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

// Detail Section Component
const DetailSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isDark: boolean;
}> = ({ title, icon, children, isDark }) => {
    const { theme } = useTheme();

    return (
        <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {icon}
                <Text style={[{
                    marginLeft: 8,
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.text
                }]}>
                    {title}
                </Text>
            </View>
            <View style={[{
                borderRadius: 12,
                padding: 16,
                backgroundColor: theme.surface
            }]}>
                {children}
            </View>
        </View>
    );
};

// Detail Row Component
const DetailRow: React.FC<{
    label: string;
    value: string | React.ReactNode;
    isDark: boolean;
    highlight?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, isDark, highlight = false, icon }) => {
    const { theme } = useTheme();

    return (
        <View style={[{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border
        }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                <Text style={[{
                    color: theme.textSecondary
                }]}>
                    {label}
                </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {typeof value === 'string' ? (
                    <Text style={[{
                        fontWeight: '500',
                        textAlign: 'right',
                        color: highlight ? theme.primary : theme.text
                    }]}>
                        {value}
                    </Text>
                ) : (
                    value
                )}
            </View>
        </View>
    );
};

// Helper function to map medicine form to image category
const getImageKey = (form: MedicineForm): keyof typeof medicines | null => {
    const formMapping: Record<MedicineForm, keyof typeof medicines> = {
        [MedicineForm.PILL]: 'pill',
        [MedicineForm.CAPSULE]: 'capsule',
        [MedicineForm.TABLET]: 'pill',
        [MedicineForm.INJECTION]: 'injection',
        [MedicineForm.LIQUID]: 'liquid',
        [MedicineForm.DROPS]: 'liquid',
        [MedicineForm.INHALER]: 'inhaler',
        [MedicineForm.POWDER]: 'powder',
        [MedicineForm.PATCH]: 'patch',
        [MedicineForm.GEL]: 'gel',
        [MedicineForm.SPRAY]: 'spray',
        [MedicineForm.HARDCAPSULE]: 'hardcapsule',
        [MedicineForm.CREAM]: 'cream',
        [MedicineForm.GUMMYBEAR]: 'gummybear',
        [MedicineForm.OTHER]: 'pill',
    };

    return formMapping[form] || null;
};

const MedicineDetailScreen: React.FC<MedicineDetailScreenProps> = ({ navigation, route }) => {
    const { medicineId } = route.params as { medicineId: string };
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showContextMenu, setShowContextMenu] = useState(false);

    // Helper functions for display names
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
            [MedicineForm.HARDCAPSULE]: t('hardCapsule') || 'Hard Capsule',
            [MedicineForm.CREAM]: t('cream') || 'Cream',
            [MedicineForm.GUMMYBEAR]: t('gummybear') || 'Gummy Bear',
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

    const formatMinutesToTime = (minutes: number | undefined) => {
        if (minutes === undefined) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours} hr${hours !== 1 ? 's' : ''} ` : ''}${mins > 0 ? `${mins} min${mins !== 1 ? 's' : ''}` : ''}`;
    };

    // Get medicine image based on form and colorKey
    const getMedicineImageSource = () => {
        if (!medicine || !medicine.form || !medicine.icon) return null;

        const imageKey = getImageKey(medicine.form);
        if (!imageKey || !medicines[imageKey]) return null;

        const medicineImages = medicines[imageKey] as Record<string, any>;
        return medicineImages[medicine.icon] || null;
    };

    // Fetch medicine details
    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const user = await UserStorageService.getStoredUser();
                if (!user) throw new Error('User not found');

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

    // Action handlers
    const handleDelete = () => {
        if (!medicine) return;
        setShowContextMenu(false);

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
        setShowContextMenu(false);

        try {
            const user = await UserStorageService.getStoredUser();
            if (!user) throw new Error('User not found');

            if (medicine.isActive) {
                await medicineUsageService.pauseMedicine(user.id, medicine.id);
            } else {
                await medicineUsageService.resumeMedicine(user.id, medicine.id);
            }

            const updatedMedicine = await medicineService.getMedicineById(user.id, medicine.id);
            setMedicine(updatedMedicine);
        } catch (error) {
            console.error('Error toggling medicine status:', error);
            Alert.alert(t('error') || 'Error', t('toggleError') || 'Failed to update medicine status');
        }
    };

    const handleEdit = () => {
        setShowContextMenu(false);
        if (medicine) {
            navigation.navigate('EditMedicine', { medicineId: medicine.id });
        }
    };

    // Loading state
    if (loading) {
        return (
            <View style={[{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.background
            }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Not found state
    if (!medicine) {
        return (
            <View style={[{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.background
            }]}>
                <Text style={[{
                    fontSize: 18,
                    color: theme.text
                }]}>
                    {t('medicineNotFound') || 'Medicine not found'}
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[{
                        marginTop: 16,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                        backgroundColor: theme.surface
                    }]}
                >
                    <Text style={[{
                        fontWeight: '500',
                        color: theme.text
                    }]}>
                        {t('goBack') || 'Go Back'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculate values
    const totalDailyAmount = medicine.intakeSchedules.reduce((sum, schedule) => sum + schedule.amount, 0);
    const statusColor = medicine.isActive ? '#10B981' : '#F59E0B';
    const statusText = medicine.isActive ? (t('active') || 'Active') : (t('paused') || 'Paused');

    // Inventory calculation
    const inventoryPercentage = medicine.totalInventory && medicine.currentInventory
        ? Math.round((medicine.currentInventory / medicine.totalInventory) * 100)
        : 0;

    const inventoryStatus = inventoryPercentage > 75 ? 'High' :
        inventoryPercentage > 25 ? 'Medium' : 'Low';

    const inventoryColor = inventoryPercentage > 75 ? '#10B981' :
        inventoryPercentage > 25 ? '#F59E0B' : '#EF4444';

    // Get medicine image
    const medicineImageSource = getMedicineImageSource();

    return (
        <View style={[{ flex: 1, backgroundColor: theme.background }]}>
            {/* Modern Header */}
            <View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                paddingTop: Platform.OS === 'ios' ? 48 : 28,
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4
            }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8 }}
                >
                    <X size={24} color={theme.text} />
                </TouchableOpacity>

                <Text
                    style={[{
                        fontSize: 20,
                        fontWeight: 'bold',
                        flex: 1,
                        marginHorizontal: 12,
                        textAlign: 'center',
                        color: theme.text
                    }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {medicine.name}
                </Text>

                <TouchableOpacity
                    onPress={() => setShowContextMenu(true)}
                    style={{ padding: 8 }}
                >
                    <MoreVertical size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1, padding: 20 }}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                {/* Medicine Card */}
                <View style={[{
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    backgroundColor: isDark ? theme.surface : theme.primaryLight + '30',
                    borderLeftWidth: 6,
                    borderLeftColor: statusColor
                }]}>
                    <View style={[{
                        width: 70,
                        height: 70,
                        borderRadius: 12,
                        alignItems: 'center',
                        marginLeft: -15,
                        overflow: 'hidden'
                    }]}>
                            <Image
                                source={medicineImageSource}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />

                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={[{
                            fontSize: 20,
                            fontWeight: 'bold',
                            marginBottom: 4,
                            color: theme.text
                        }]}>
                            {medicine.name}
                        </Text>

                        {medicine.conditionReason && (
                            <Text style={[{
                                fontSize: 14,
                                marginBottom: 12,
                                color: theme.textSecondary
                            }]}>
                                {t('for') || 'For'} {medicine.conditionReason}
                            </Text>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View
                                style={[{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    marginRight: 8,
                                    backgroundColor: statusColor
                                }]}
                            />
                            <Text style={[{
                                fontWeight: '500',
                                color: theme.textSecondary
                            }]}>
                                {statusText}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Basic Information */}
                <DetailSection
                    title={t('basicInformation') || 'Basic Information'}
                    icon={<Info size={20} color={theme.textSecondary} />}
                    isDark={isDark}
                >
                    <DetailRow
                        label={t('medicineName') || 'Medicine Name'}
                        value={medicine.name}
                        isDark={isDark}
                        highlight
                        icon={<Pill size={16} color={theme.textSecondary} />}
                    />
                    <DetailRow
                        label={t('form') || 'Form'}
                        value={getFormDisplayName(medicine.form)}
                        isDark={isDark}
                        icon={<Package size={16} color={theme.textSecondary} />}
                    />
                    {medicine.conditionReason && (
                        <DetailRow
                            label={t('condition') || 'Condition'}
                            value={medicine.conditionReason}
                            isDark={isDark}
                            icon={<AlertTriangle size={16} color={theme.textSecondary} />}
                        />
                    )}
                    {medicine.formattedDosage && (
                        <DetailRow
                            label={t('dosage') || 'Dosage'}
                            value={medicine.formattedDosage}
                            isDark={isDark}
                            icon={<Circle size={16} color={theme.textSecondary} />}
                        />
                    )}
                </DetailSection>

                {/* Schedule Information */}
                <DetailSection
                    title={t('schedule') || 'Schedule'}
                    icon={<Clock size={20} color={theme.textSecondary} />}
                    isDark={isDark}
                >
                    <DetailRow
                        label={t('frequency') || 'Frequency'}
                        value={getFrequencyDisplayName(medicine.frequencyType)}
                        isDark={isDark}
                        highlight
                        icon={<Calendar size={16} color={theme.textSecondary} />}
                    />
                    <DetailRow
                        label={t('timesPerDay') || 'Times per day'}
                        value={medicine.intakeSchedules.length.toString()}
                        isDark={isDark}
                        icon={<Clock size={16} color={theme.textSecondary} />}
                    />
                    <DetailRow
                        label={t('totalDailyAmount') || 'Total daily amount'}
                        value={totalDailyAmount.toString()}
                        isDark={isDark}
                        icon={<Box size={16} color={theme.textSecondary} />}
                    />

                    <View style={[{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: theme.border
                    }]}>
                        <Text style={[{
                            fontSize: 16,
                            fontWeight: '500',
                            marginBottom: 12,
                            color: theme.textSecondary
                        }]}>
                            {t('intakeTimes') || 'Intake Times'}
                        </Text>
                        {medicine.intakeSchedules.map((schedule, index) => (
                            <View
                                key={index}
                                style={[{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingVertical: 8
                                }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: theme.primary,
                                        marginRight: 12
                                    }]} />
                                    <Text style={[{
                                        color: theme.textSecondary
                                    }]}>
                                        {formatTime(schedule.time)}
                                    </Text>
                                </View>
                                <Text style={[{
                                    fontWeight: '500',
                                    color: theme.text
                                }]}>
                                    {schedule.amount} {t('dose') || 'dose'}{schedule.amount !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                </DetailSection>

                {/* Inventory Management */}
                {(medicine.currentInventory !== undefined ||
                    medicine.totalInventory !== undefined ||
                    medicine.autoDeductInventory !== undefined) && (
                    <DetailSection
                        title={t('inventory') || 'Inventory'}
                        icon={<Box size={20} color={theme.textSecondary} />}
                        isDark={isDark}
                    >
                        {medicine.currentInventory !== undefined && medicine.totalInventory !== undefined && (
                            <View style={{ marginBottom: 12 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 4
                                }}>
                                    <Text style={[{
                                        fontSize: 14,
                                        color: theme.textSecondary
                                    }]}>
                                        {t('inventoryLevel') || 'Inventory Level'}
                                    </Text>
                                    <Text style={[{
                                        fontWeight: '500',
                                        color: theme.text
                                    }]}>
                                        {inventoryPercentage}% ({inventoryStatus})
                                    </Text>
                                </View>
                                <View style={[{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: theme.border
                                }]}>
                                    <View
                                        style={[{
                                            height: 8,
                                            borderRadius: 4,
                                            width: `${inventoryPercentage}%`,
                                            backgroundColor: inventoryColor
                                        }]}
                                    />
                                </View>
                            </View>
                        )}

                        {medicine.autoDeductInventory !== undefined && (
                            <DetailRow
                                label={t('autoDeduct') || 'Auto Deduct Inventory'}
                                value={medicine.autoDeductInventory ? (t('yes') || 'Yes') : (t('no') || 'No')}
                                isDark={isDark}
                                icon={
                                    medicine.autoDeductInventory ?
                                        <Check size={16} color="#10B981" /> :
                                        <XIcon size={16} color="#EF4444" />
                                }
                            />
                        )}
                    </DetailSection>
                )}

                {/* Notification Settings */}
                {(medicine.notificationsEnabled !== undefined ||
                    medicine.missedDoseThresholdMinutes !== undefined ||
                    medicine.allowLateIntake !== undefined ||
                    medicine.lateIntakeWindowHours !== undefined) && (
                    <DetailSection
                        title={t('notificationSettings') || 'Notification Settings'}
                        icon={<Bell size={20} color={theme.textSecondary} />}
                        isDark={isDark}
                    >
                        {medicine.notificationsEnabled !== undefined && (
                            <DetailRow
                                label={t('notifications') || 'Notifications'}
                                value={medicine.notificationsEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                                isDark={isDark}
                                icon={
                                    medicine.notificationsEnabled ?
                                        <Bell size={16} color="#10B981" /> :
                                        <BellOff size={16} color="#EF4444" />
                                }
                            />
                        )}

                        {medicine.missedDoseThresholdMinutes !== undefined && (
                            <DetailRow
                                label={t('missedDoseAlert') || 'Missed Dose Alert'}
                                value={formatMinutesToTime(medicine.missedDoseThresholdMinutes)}
                                isDark={isDark}
                                icon={<ClockIcon size={16} color={theme.textSecondary} />}
                            />
                        )}

                        {medicine.allowLateIntake !== undefined && (
                            <DetailRow
                                label={t('allowLateIntake') || 'Allow Late Intake'}
                                value={medicine.allowLateIntake ? (t('yes') || 'Yes') : (t('no') || 'No')}
                                isDark={isDark}
                                icon={
                                    medicine.allowLateIntake ?
                                        <Check size={16} color="#10B981" /> :
                                        <XIcon size={16} color="#EF4444" />
                                }
                            />
                        )}

                        {medicine.lateIntakeWindowHours !== undefined && (
                            <DetailRow
                                label={t('lateIntakeWindow') || 'Late Intake Window'}
                                value={`${medicine.lateIntakeWindowHours} ${t('hours') || 'hours'}`}
                                isDark={isDark}
                                icon={<ClockIcon size={16} color={theme.textSecondary} />}
                            />
                        )}
                    </DetailSection>
                )}

                {/* Additional Information */}
                <DetailSection
                    title={t('additionalInfo') || 'Additional Information'}
                    icon={<Calendar size={20} color={theme.textSecondary} />}
                    isDark={isDark}
                >
                    {medicine.scheduleDuration && (
                        <DetailRow
                            label={t('duration') || 'Duration'}
                            value={medicine.scheduleDuration === 365
                                ? (t('ongoing') || 'Ongoing')
                                : `${medicine.scheduleDuration} ${medicine.scheduleDuration === 1 ? t('day') || 'day' : t('days') || 'days'}`
                            }
                            isDark={isDark}
                            icon={<Calendar size={16} color={theme.textSecondary} />}
                        />
                    )}
                    {medicine.refillReminderThreshold && (
                        <DetailRow
                            label={t('refillReminder') || 'Refill reminder'}
                            value={`${medicine.refillReminderThreshold} ${medicine.refillReminderThreshold === 1 ? t('day') || 'day' : t('days') || 'days'} ${t('before') || 'before'}`}
                            isDark={isDark}
                            icon={<Bell size={16} color={theme.textSecondary} />}
                        />
                    )}
                    {medicine.foodInstruction && (
                        <DetailRow
                            label={t('foodInstructions') || 'Food instructions'}
                            value={getFoodInstructionDisplayName(medicine.foodInstruction)}
                            isDark={isDark}
                            icon={<Info size={16} color={theme.textSecondary} />}
                        />
                    )}
                </DetailSection>
            </ScrollView>

            {/* Context Menu */}
            <MedicineContextMenu
                visible={showContextMenu}
                medicine={medicine}
                onClose={() => setShowContextMenu(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePause={handleTogglePause}
                isDark={isDark}
                t={t as (key: string) => string}
            />
        </View>
    );
};

export default MedicineDetailScreen;