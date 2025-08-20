import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Modal,
    RefreshControl, Image, Alert
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import {RootStackParamList} from '../navigation/AppNavigator';
import HorizontalCalendar from "@/app/components/HorizontalCalendar";
import dayjs, {Dayjs} from "dayjs";
import {medicineUsageService} from '../services/medicine/usage/MedicineUsageService';
import {
    DailyMedicineSchedule,
    IntakeEvent, IntakeStatus,
    SkipMedicineRequest,
    TakeMedicineRequest
} from '../services/medicine/usage/MedicineUsageTypes';
import {UserStorageService} from "@/app/services/user";
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {medicines} from "@/assets/images";
import {MedicineForm} from "@/app/services/medicine/medicine/MedicineServiceTypes";
import {MedicineNotificationService} from "@/app/services/background/MedicineNotificationService";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTab'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;

}

export default function HomeScreen({navigation}: HomeScreenProps) {
    const {t, isRTL} = useLanguage();
    const {isDark, theme} = useTheme();
    const [dailySchedule, setDailySchedule] = useState<DailyMedicineSchedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIntake, setSelectedIntake] = useState<IntakeEvent | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [customTakeTime, setCustomTakeTime] = useState<Date>(new Date());
    const [showTakeOptions, setShowTakeOptions] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());


    const loadUserId = async () => {
        try {
            const user = await UserStorageService.getStoredUser();
            if (user) {
                setUserId(user.id);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };
    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if (selectedDate && userId) {
            loadDailySchedule(selectedDate.format('YYYY-MM-DD'));
        }
    }, [selectedDate, userId]);

    useEffect(() => {
        const initNotifications = async () => {
            await MedicineNotificationService.initialize();
            await MedicineNotificationService.requestPermissions();
            await MedicineNotificationService.enableAutoCheck(userId);
            await MedicineNotificationService.scheduleUpcomingReminders(userId);
        };
        initNotifications();
    }, [userId]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: selectedDate.format('MMMM D, YYYY')
        });
    }, [navigation, selectedDate]);

    const loadDailySchedule = async (date: string) => {
        setLoading(true);
        try {
            const schedule = await medicineUsageService.getDailySchedule(userId!, date);
            setDailySchedule(schedule);
        } catch (error) {
            const cached = await medicineUsageService.getCachedTodaySchedule(userId!);
            if (cached && cached.date === date) {
                setDailySchedule(cached);
            } else {
                setDailySchedule(null);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (selectedDate && userId) {
            loadDailySchedule(selectedDate.format('YYYY-MM-DD'));
        } else {
            setRefreshing(false);
        }
    }, [selectedDate, userId]);

    const handleDateSelected = (date: Dayjs) => {
        setSelectedDate(date);
        navigation.setParams({
            dateTitle: date.format('MMMM D, YYYY'),
        });
    };

    const handleIntakePress = (intake: IntakeEvent) => {
        setSelectedIntake(intake);
        setIsModalVisible(true);
    };

    const handleTakeAction = () => {
        setShowTakeOptions(true);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setCustomTakeTime(selectedTime);
            handleTakeMedicine(selectedTime.toISOString());
        }
    };

    const handleTakeMedicine = async (takeTime: string) => {
        if (!selectedIntake) return;
        try {
            const request: TakeMedicineRequest = {
                intakeEventId: selectedIntake.id,
                actualTakeTime: takeTime,
                actualDosageAmount: selectedIntake.scheduledAmount,
                currentInventory: selectedIntake.currentInventory,
                deductFromInventory: true
            };

            const validation = medicineUsageService.validateTakeMedicineRequest(request);
            if (!validation.isValid) {
                Alert.alert(t('error'), validation.error);
                return;
            }

            await medicineUsageService.takeMedicine(userId!, request);

            if (selectedDate) {
                await loadDailySchedule(selectedDate.format('YYYY-MM-DD'));
            }
            Alert.alert(t('success'), `${selectedIntake.medicineName} ${t('markedTaken')}`);
            setIsModalVisible(false);
            if (selectedIntake.currentInventory <= selectedIntake.refillReminderThreshold) {
                const currentInventory = selectedIntake.currentInventory - selectedIntake.scheduledAmount ;
                const title = t('refillReminderTitle');
                const message = t('refillReminderMessage')
                    .replace('{{medicineName}}', selectedIntake.medicineName)
                    .replace('{{currentInventory}}', currentInventory.toString());
                Alert.alert(title,message);
            }
        } catch (error) {
            console.error('Error taking medicine:', error);
            Alert.alert(t('error'), t('takeMedicineFailed'));
        }
    };

    const handleSkipMedicine = async () => {
        if (!selectedIntake) return;

        try {
            const request: SkipMedicineRequest = {
                intakeEventId: selectedIntake.id,
                skipReason: "test", //ask for reason
                note: "test",// reuse the reason
            };

            const validation = medicineUsageService.validateSkipMedicineRequest(request);
            if (!validation.isValid) {
                Alert.alert(t('error'), validation.error);
                return;
            }

            await medicineUsageService.skipMedicine(userId!, request);

            if (selectedDate) {
                await loadDailySchedule(selectedDate.format('YYYY-MM-DD'));
            }

            setIsModalVisible(false);
            Alert.alert(t('success'), `${selectedIntake.medicineName} ${t('markedSkipped')}`);
        } catch (error) {
            console.error('Error skipping medicine:', error);
            Alert.alert(t('error'), t('skipMedicineFailed'));
        }
    };

    const handleMarkMissed = async () => {
        if (!selectedIntake) return;

        if (selectedIntake.status === IntakeStatus.MISSED) {
            setIsModalVisible(false);
            return;
        }

        try {
            await medicineUsageService.markEventAsMissed(userId!, selectedIntake.id);

            if (selectedDate) {
                await loadDailySchedule(selectedDate.format('YYYY-MM-DD'));
            }

            setIsModalVisible(false);
            Alert.alert(t('success'), `${selectedIntake.medicineName} ${t('markedMissed')}`);
        } catch (error) {
            console.error('Error marking as missed:', error);
            Alert.alert(t('error'), t('markMissedFailed'));
        }
    };

    const getStatusColor = (status: IntakeStatus) => {
        switch (status) {
            case IntakeStatus.TAKEN:
                return theme.success;
            case IntakeStatus.MISSED:
                return theme.error;
            case IntakeStatus.SKIPPED:
                return theme.warning;
            case IntakeStatus.PAUSED:
                return theme.warning;
            default:
                return theme.textSecondary;
        }
    };

    const getStatusText = (status: IntakeStatus) => {
        switch (status) {
            case IntakeStatus.TAKEN:
                return t('taken');
            case IntakeStatus.MISSED:
                return t('missed');
            case IntakeStatus.SKIPPED:
                return t('skipped');
            case IntakeStatus.PAUSED:
                return t('paused');
            default:
                return t('scheduled');
        }
    };

    const formatTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateTime: string) => {
        return new Date(dateTime).toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderIntakeItem = ({item: intake}: { item: IntakeEvent }) => {
        const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
        const textAlign = isRTL ? 'text-right' : 'text-left';
        const formImageSource = getMedicineImageSource(intake);


        return (
            <TouchableOpacity
                onPress={() => handleIntakePress(intake)}
                className="rounded-2xl mb-3 mx-4 p-4 shadow-sm active:opacity-80"
                style={{
                    backgroundColor: theme.card,
                    shadowColor: isDark ? '#000' : '#888',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderLeftWidth: 4,
                    borderLeftColor: getStatusColor(intake.status),
                    borderRightWidth: 1,
                    borderRightColor: theme.border + '30',
                }}
            >
                <View className={`items-center ${flexDirection}`}>
                    <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                    >
                        <Image
                            source={formImageSource}
                            style={{width: '190%', height: '190%'}}
                        />
                    </View>

                    <View className={`flex-1 mx-3 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                        <View className={`justify-between items-center ${flexDirection}`}>
                            <Text className="text-base font-semibold" style={{color: theme.text}}>
                                {formatTime(intake.scheduledDateTime)}
                            </Text>
                            <View
                                className="py-1 px-2 rounded-full"
                                style={{backgroundColor: `${getStatusColor(intake.status)}22`}}
                            >
                                <Text
                                    className="text-xs font-semibold uppercase"
                                    style={{color: getStatusColor(intake.status)}}
                                >
                                    {getStatusText(intake.status)}
                                </Text>
                            </View>
                        </View>

                        <Text
                            className="text-base font-medium mt-1"
                            style={{color: theme.text}}
                        >
                            {intake.medicineName}
                        </Text>

                        <Text
                            className="text-sm mt-1"
                            style={{color: theme.textSecondary}}
                        >
                            {intake.formattedDosage || `${intake.scheduledAmount} ${t('units')}`}
                        </Text>
                    </View>

                    <Icon
                        name="chevron-right"
                        size={24}
                        color={theme.textSecondary}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    const renderStatItem = (label: string, value: number, color: string) => (
        <View className="items-center">
            <Text className="text-xs" style={{color: theme.textSecondary}}>
                {label}
            </Text>
            <Text className="text-lg font-bold mt-1" style={{color}}>
                {value}
            </Text>
        </View>
    );

    const renderScheduleContent = () => {
        if (loading && !refreshing) {
            return (
                <View className="flex-1 justify-center items-center p-8">
                    <ActivityIndicator size="large" color={theme.primary}/>
                    <Text
                        className="mt-4 text-base"
                        style={{color: theme.textSecondary}}
                    >
                        {t('loadingSchedule')}
                    </Text>
                </View>
            );
        }

        if (!dailySchedule || dailySchedule.intakeEvents.length === 0) {
            return (
                <View className="flex-1 justify-center items-center p-8">
                    <Icon name="medication" size={48} color={theme.textSecondary}/>
                    <Text
                        className="mt-4 text-base text-center"
                        style={{color: theme.textSecondary}}
                    >
                        {t(loading ? 'loadingSchedule' : 'noMedicinesScheduled')}
                    </Text>
                    {!loading && (
                        <Text className="text-xs mt-2 italic" style={{color: theme.textSecondary}}>
                            {t('offlineDataDisclaimer')}
                        </Text>
                    )}
                </View>
            );
        }

        return (
            <View className="flex-1">
                <View
                    className="rounded-xl m-4 p-4 flex-row justify-between"
                    style={{backgroundColor: theme.surface}}
                >
                    {renderStatItem(t('total'), dailySchedule.totalScheduled, theme.text)}
                    {renderStatItem(t('taken'), dailySchedule.totalTaken, theme.success)}
                    {renderStatItem(t('skipped'), dailySchedule.totalSkipped, theme.warning)}
                    {renderStatItem(t('missed'), dailySchedule.totalMissed, theme.error)}
                </View>

                <FlatList
                    data={dailySchedule.intakeEvents}
                    keyExtractor={(item) => item.id}
                    renderItem={renderIntakeItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 24}}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                />
            </View>
        );
    };

    const renderTakeOptions = () => (
        <View className="p-5 w-full">
            <Text className="text-lg font-bold mb-4 text-center" style={{color: theme.text}}>
                {t('whenTakenQuestion')}
            </Text>

            <View className="flex-row justify-between">
                <TouchableOpacity
                    className="py-3 px-6 rounded-lg items-center justify-center border-2"
                    style={{
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + '22'
                    }}
                    onPress={() => {
                        setShowTakeOptions(false);
                        handleTakeMedicine(new Date().toISOString());
                    }}
                >
                    <Text className="text-base font-semibold" style={{color: theme.primary}}>
                        {t('now')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="py-3 px-6 rounded-lg items-center justify-center border-2"
                    style={{
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + '22'
                    }}
                    onPress={() => {
                        setShowTakeOptions(false);
                        setShowTimePicker(true);
                    }}
                >
                    <Text className="text-base font-semibold" style={{color: theme.primary}}>
                        {t('scheduleTime')}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                className="py-3 mt-4 rounded-lg items-center justify-center"
                onPress={() => setShowTakeOptions(false)}
            >
                <Text className="text-base font-semibold" style={{color: theme.textSecondary}}>
                    {t('cancel')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const getImageKey = (form: MedicineForm): keyof typeof medicines | null => {
        const formMapping: Record<MedicineForm, keyof typeof medicines> = {
            [MedicineForm.PILL]: 'pill',
            [MedicineForm.CAPSULE]: 'capsule',
            [MedicineForm.TABLET]: 'pill',
            [MedicineForm.INJECTION]: 'injection',
            [MedicineForm.LIQUID]: 'liquid',
            [MedicineForm.DROP]: 'drop',
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

    const getMedicineImageSource = (intake: IntakeEvent) => {
        if (!intake || !intake.medicineIcon || !intake.medicineColor) return null;

        const imageKey = getImageKey(intake.medicineForm);
        if (!imageKey || !medicines[imageKey]) return null;

        const medicineImages = medicines[imageKey] as Record<string, any>;
        return medicineImages[intake.medicineIcon] || null;
    };

    const renderModalContent = () => {
        if (!selectedIntake) return null;

        const showActions = selectedIntake.status === IntakeStatus.SCHEDULED ||
            selectedIntake.status === IntakeStatus.MISSED;

        const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
        const textAlign = isRTL ? 'text-right' : 'text-left';
        const formImageSource = getMedicineImageSource(selectedIntake);


        return (
            <View
                className="rounded-3xl px-14 py-10 w-11/12"
                style={{
                    backgroundColor: theme.card,
                    borderWidth: 2,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 10},
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    elevation: 10,
                }}
            >
                {/* Medicine header with navigation */}
                <TouchableOpacity
                    className={`items-center mb-4 ${flexDirection}`}
                    onPress={() => {
                        setIsModalVisible(false);
                        navigation.navigate('MedicineDetail', {medicineId: selectedIntake.medicineId});
                    }}
                >
                    <View className="w-14 h-14 rounded-full items-center justify-center">
                        <Image
                            source={formImageSource}
                            style={{width: '190%', height: '190%'}}
                        />
                    </View>
                    <View className={`flex-1 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <Text
                            className="text-xl font-bold"
                            style={{color: theme.text}}
                            numberOfLines={1}
                        >
                            {selectedIntake.medicineName}
                        </Text>
                        <Text
                            className="text-sm mt-1"
                            style={{color: theme.textSecondary}}
                        >
                            {selectedIntake.formattedDosage || `${selectedIntake.scheduledAmount} ${t('units')}`}
                        </Text>
                    </View>
                    <Icon
                        name="open-in-new"
                        size={20}
                        color={theme.textSecondary}
                    />
                </TouchableOpacity>

                <View className="border-b border-gray-200 dark:border-gray-700 my-4"/>

                {/* Medicine details */}
                <View className="mb-5">
                    <View className={`items-center ${flexDirection} mb-3`}>
                        <Icon name="access-time" size={20} color={theme.textSecondary}/>
                        <Text
                            className={`text-base ml-2 ${textAlign}`}
                            style={{color: theme.text}}
                        >
                            <Text style={{color: theme.textSecondary}}>{t('scheduledTime')}: </Text>
                            {formatTime(selectedIntake.scheduledDateTime)}
                        </Text>
                    </View>

                    <View className={`items-center ${flexDirection} mb-3`}>
                        <Icon name="calendar-today" size={20} color={theme.textSecondary}/>
                        <Text
                            className={`text-base ml-2 ${textAlign}`}
                            style={{color: theme.text}}
                        >
                            <Text style={{color: theme.textSecondary}}>{t('date')}: </Text>
                            {formatDate(selectedIntake.scheduledDateTime)}
                        </Text>
                    </View>

                    <View className={`items-center ${flexDirection} mb-3`}>
                        <Icon name='local-dining' size={20} color={theme.textSecondary} />
                        <Text
                            className={`text-base ml-2 ${textAlign}`}
                            style={{color: theme.text}}
                        >
                            <Text style={{color: theme.textSecondary}}>
                                {t('FoodInstruction')}:{" "}
                            </Text>
                            {selectedIntake.foodInstruction || t('Noinstruction')}
                        </Text>
                    </View>

                    {selectedIntake.status !== IntakeStatus.SCHEDULED && selectedIntake.actualDateTime && (
                        <View className={`items-center ${flexDirection} mb-3`}>
                            <Icon name="check-circle" size={20} color={getStatusColor(selectedIntake.status)}/>
                            <Text
                                className={`text-base ml-2 ${textAlign}`}
                                style={{color: theme.text}}
                            >
                                <Text style={{color: theme.textSecondary}}>{t('actualTime')}: </Text>
                                {formatTime(selectedIntake.actualDateTime)}
                            </Text>

                        </View>
                    )}

                    {selectedIntake.status === IntakeStatus.SKIPPED && selectedIntake.skipReason && (
                        <View className={`items-center ${flexDirection} mb-3`}>
                            <Icon name="warning" size={20} color={theme.warning}/>
                            <Text
                                className={`text-base ml-2 ${textAlign}`}
                                style={{color: theme.warning}}
                            >
                                <Text style={{color: theme.textSecondary}}>{t('skipReason')}: </Text>
                                {selectedIntake.skipReason}
                            </Text>
                        </View>
                    )}

                    {selectedIntake.note && (
                        <View className={`items-center ${flexDirection} mb-3`}>
                            <Icon name="notes" size={20} color={theme.textSecondary}/>
                            <Text
                                className={`text-base ml-2 ${textAlign}`}
                                style={{color: theme.text}}
                            >
                                <Text style={{color: theme.textSecondary}}>{t('note')}: </Text>
                                {selectedIntake.note}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action buttons */}
                {showActions && (
                    <View className="mt-4">
                        <View className={`flex-row justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <TouchableOpacity
                                onPress={handleTakeAction}
                                className="py-3 px-4 rounded-3xl mr-2 border-2"
                                style={{
                                    borderColor: theme.success,
                                    backgroundColor: theme.success + '22'
                                }}
                            >
                                <Text className="text-base font-semibold text-center" style={{color: theme.success}}>
                                    {t('take')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSkipMedicine}
                                className="py-3 px-4 rounded-3xl  mx-2 border-2"
                                style={{
                                    borderColor: theme.warning,
                                    backgroundColor: theme.warning + '22'
                                }}
                            >
                                <Text className="text-base font-semibold text-center" style={{color: theme.warning}}>
                                    {t('skip')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleMarkMissed}
                                className="py-3 px-4 rounded-3xl  ml-2 border-2"
                                style={{
                                    borderColor: theme.error,
                                    backgroundColor: theme.error + '22'
                                }}
                            >
                                <Text className="text-base font-semibold text-center" style={{color: theme.error}}>
                                    {t('missed')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{backgroundColor: theme.background}}>
            <HorizontalCalendar onDateSelected={handleDateSelected}/>
            <View className="flex-1">
                {renderScheduleContent()}
            </View>

            {/* Intake Detail Modal */}
            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-center items-center p-4 bg-black/50"
                    activeOpacity={1}
                    onPress={() => setIsModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {renderModalContent()}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Take Options Modal */}
            <Modal
                visible={showTakeOptions}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowTakeOptions(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-center items-center  bg-black/50"
                    activeOpacity={1}
                    onPress={() => setShowTakeOptions(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        className="w-4/5"
                    >
                        <View
                            className="rounded-3xl p-4"
                            style={{
                                backgroundColor: theme.card,
                                borderWidth: 2,
                                borderColor: theme.border,
                            }}
                        >
                            {renderTakeOptions()}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={customTakeTime}
                    mode="time"
                    display="inline"
                    onChange={handleTimeChange}
                    textColor={theme.text}
                    themeVariant={isDark ? 'dark' : 'light'}
                />
            )}
        </SafeAreaView>
    );
}