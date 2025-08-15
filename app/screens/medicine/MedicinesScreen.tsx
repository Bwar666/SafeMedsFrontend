import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, Alert, StyleSheet, Pressable } from 'react-native';
import { Search, Plus, Pill, Clock, MoreVertical, AlertTriangle, Edit3, Trash2, Pause, Play, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { medicineService, medicineUsageService } from '../../services';
import {MedicineForm, MedicineResponse} from '../../services/medicine/medicine/MedicineServiceTypes';
import {UserStorageService} from "@/app/services/user";
import { medicines } from '@/assets/images';
import { Image } from 'react-native';


// Navigation prop type
type MedicinesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTab'>;

interface MedicinesScreenProps {
    navigation: MedicinesScreenNavigationProp;
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
                            backgroundColor: isDark ? '#334155' : '#f3f4f6',
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
                            backgroundColor: isDark ? '#334155' : '#f3f4f6',
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
                            backgroundColor: isDark ? '#334155' : '#f3f4f6',
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
                            backgroundColor: isDark ? '#334155' : '#f3f4f6',
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

// Medicine Item Component with navigation
const MedicineItem: React.FC<{
    medicine: MedicineResponse;
    onPress: () => void;
    onMenuPress: () => void;
    isDark: boolean;
}> = ({ medicine, onPress, onMenuPress, isDark }) => {
    const { theme } = useTheme();

    const statusColors = {
        active: '#10B981',
        paused: '#F59E0B',
        completed: '#6B7280',
    };

    const getStatusText = (isActive: boolean) => ({
        active: isActive ? 'Active' : 'Paused',
        color: isActive ? statusColors.active : statusColors.paused
    });

    const status = getStatusText(medicine.isActive);

    // Calculate next dose time from intakeSchedules
    const getNextDose = () => {
        if (!medicine.isActive) return 'Paused';
        if (!medicine.intakeSchedules.length) return 'Not scheduled';

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Find next intake time today
        const todayIntakes = medicine.intakeSchedules
            .map(schedule => {
                const [hours, minutes] = schedule.time.split(':').map(Number);
                return { time: hours * 60 + minutes, original: schedule.time };
            })
            .sort((a, b) => a.time - b.time);

        const nextIntake = todayIntakes.find(intake => intake.time > currentTime);

        if (nextIntake) {
            const hours = Math.floor(nextIntake.time / 60);
            const minutes = nextIntake.time % 60;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 || 12;
            return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }

        // Next dose is tomorrow - show first intake time
        if (todayIntakes.length > 0) {
            const firstIntake = todayIntakes[0];
            const hours = Math.floor(firstIntake.time / 60);
            const minutes = firstIntake.time % 60;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 || 12;
            return `Tomorrow ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }

        return 'Not scheduled';
    };
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

    const getMedicineImageSource = () => {
        if (!medicine || !medicine.form || !medicine.icon) return null;

        const imageKey = getImageKey(medicine.form);
        if (!imageKey || !medicines[imageKey]) return null;

        const medicineImages = medicines[imageKey] as Record<string, any>;
        return medicineImages[medicine.icon] || null;
    };


    const formImageSource = getMedicineImageSource();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[{
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: theme.card,
                shadowColor: isDark ? '#000' : '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                opacity: !medicine.isActive ? 0.75 : 1
            }]}
            activeOpacity={0.7}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                        <View style={[{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            marginRight: 12,
                        }]}>
                            <Image
                                source={formImageSource}
                                style={{ width: '190%', height: '190%' }}
                            />
                        </View>
                        <Text style={[{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.text,
                            opacity: !medicine.isActive ? 0.75 : 1
                        }]}>
                            {medicine.name}
                        </Text>
                    </View>

                    <Text style={[{
                        fontSize: 14,
                        color: theme.textSecondary,
                        marginLeft: 44
                    }]}>
                        {medicine.formattedDosage || 'No dosage'} • {medicine.intakeSchedules.length}x daily
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onMenuPress}
                    style={{ padding: 8 }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <MoreVertical size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Next Dose */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 44 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={14} color={theme.textSecondary} />
                    <Text style={[{
                        fontSize: 14,
                        marginLeft: 4,
                        color: theme.textSecondary
                    }]}>
                        Next: {getNextDose()}
                    </Text>
                </View>
                <View style={[{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: status.color + '20'
                }]}>
                    <Text style={[{
                        fontSize: 12,
                        fontWeight: '500',
                        color: status.color
                    }]}>
                        {status.active}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Medicine Category Tab
const CategoryTab: React.FC<{
    title: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
    isDark: boolean;
}> = ({ title, count, isActive, onPress, isDark }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 12,
                backgroundColor: isActive ? theme.primary : theme.surface
            }]}
        >
            <Text style={[{
                fontSize: 14,
                fontWeight: '500',
                color: isActive ? '#FFFFFF' : theme.textSecondary
            }]}>
                {title} ({count})
            </Text>
        </TouchableOpacity>
    );
};

// Empty State Component
const EmptyState: React.FC<{
    isDark: boolean;
    t: (key: string) => string;
    onAddMedicine: () => void;
}> = ({ isDark, t, onAddMedicine }) => {
    const { theme } = useTheme();

    return (
        <View style={[{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            backgroundColor: theme.card,
            borderRadius: 12,
            marginTop: 16
        }]}>
            <Pill size={64} color={theme.textSecondary} />
            <Text style={[{
                fontSize: 20,
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
                color: theme.text
            }]}>
                {t('noMedicines') || 'No medicines yet'}
            </Text>
            <Text style={[{
                fontSize: 14,
                textAlign: 'center',
                color: theme.textSecondary,
                marginBottom: 24
            }]}>
                {t('addFirstMedicineDesc') || 'Add your first medicine to start tracking your health journey'}
            </Text>
            <TouchableOpacity
                onPress={onAddMedicine}
                style={[{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12
                }]}
            >
                <Text style={[{
                    color: '#FFFFFF',
                    fontWeight: '600'
                }]}>
                    {t('addMedicine') || 'Add Medicine'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// Main Medicines Screen
const MedicinesScreen: React.FC<MedicinesScreenProps> = ({ navigation }) => {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Context Menu States
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const loadMedicines = async (useCache = true) => {
        try {
            setLoading(true);
            const user = await UserStorageService.getStoredUser();
            if (!user) return;
            const MedicineResponse = await medicineService.getMedicines(user.id, useCache);
            setMedicines(MedicineResponse);
        } catch (error) {
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load medicines when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadMedicines(true); // Always refresh when screen comes into focus
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadMedicines(true);
    }, []);

    const categories = [
        { key: 'all', title: t('all') || 'All', count: medicines.length },
        { key: 'active', title: t('active') || 'Active', count: medicines.filter(m => m.isActive).length },
        { key: 'paused', title: t('paused') || 'Paused', count: medicines.filter(m => !m.isActive).length },
    ];

    const filteredMedicines = medicines.filter(medicine => {
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'active' && medicine.isActive) ||
            (activeTab === 'paused' && !medicine.isActive);
        const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleAddMedicine = () => {
        navigation.navigate('AddMedicine');
    };

    const handleMedicinePress = (medicine: MedicineResponse) => {
        navigation.navigate('MedicineDetail', { medicineId: medicine.id });
    };

    const handleMedicineMenu = (medicine: MedicineResponse) => {
        setSelectedMedicine(medicine);
        setShowContextMenu(true);
    };

    const closeContextMenu = () => {
        setShowContextMenu(false);
        setSelectedMedicine(null);
    };

    const handleEditMedicine = () => {
        if (selectedMedicine) {
            closeContextMenu();
            navigation.navigate('EditMedicine', { medicineId: selectedMedicine.id });
        }
    };

    const handleTogglePause = async () => {
        if (!selectedMedicine || isUpdating) return;

        const action = selectedMedicine.isActive ? 'pause' : 'resume';
        const actionText = selectedMedicine.isActive
            ? (t('pauseMedicine') || 'pause medicine')
            : (t('resumeMedicine') || 'resume medicine');

        Alert.alert(
            t('confirmAction') || 'Confirm Action',
            `Are you sure you want to ${actionText} "${selectedMedicine.name}"?`,
            [
                {
                    text: t('cancel') || 'Cancel',
                    style: 'cancel',
                },
                {
                    text: selectedMedicine.isActive ? (t('pause') || 'Pause') : (t('resume') || 'Resume'),
                    onPress: async () => {
                        setIsUpdating(true);
                        try {
                            const user = await UserStorageService.getStoredUser();
                            if (!user) return;

                            // Use MedicineUsageApiService for pause/resume operations
                            if (selectedMedicine.isActive) {

                                await medicineUsageService.pauseMedicine(user.id, selectedMedicine.id);
                            } else {
                                // Resume medicine - no request object needed
                                await medicineUsageService.resumeMedicine(user.id, selectedMedicine.id);
                            }

                            // Update local state
                            setMedicines(prev =>
                                prev.map(med =>
                                    med.id === selectedMedicine.id
                                        ? { ...med, isActive: !med.isActive }
                                        : med
                                )
                            );

                            closeContextMenu();

                            Alert.alert(
                                t('success') || 'Success',
                                `${selectedMedicine.name} has been ${action}d successfully.`,
                                [{ text: t('ok') || 'OK' }]
                            );

                        } catch (error) {
                            console.error(`Error ${action}ing medicine:`, error);
                            Alert.alert(
                                t('error') || 'Error',
                                `Failed to ${action} medicine. Please try again.`,
                                [{ text: t('ok') || 'OK' }]
                            );
                        } finally {
                            setIsUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteMedicine = () => {
        if (!selectedMedicine) return;

        Alert.alert(
            t('deleteMedicine') || 'Delete Medicine',
            `Are you sure you want to delete "${selectedMedicine.name}"? This action cannot be undone.`,
            [
                {
                    text: t('cancel') || 'Cancel',
                    style: 'cancel',
                },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsUpdating(true);
                        try {
                            const user = await UserStorageService.getStoredUser();
                            if (!user) return;

                            // Call API to delete medicine
                            await medicineService.deleteMedicine(user.id, selectedMedicine.id);

                            // Update local state
                            setMedicines(prev => prev.filter(med => med.id !== selectedMedicine.id));

                            closeContextMenu();

                            // Show success message
                            Alert.alert(
                                t('success') || 'Success',
                                `${selectedMedicine.name} has been deleted successfully.`,
                                [{ text: t('ok') || 'OK' }]
                            );

                        } catch (error) {
                            console.error('Error deleting medicine:', error);
                            Alert.alert(
                                t('error') || 'Error',
                                'Failed to delete medicine. Please try again.',
                                [{ text: t('ok') || 'OK' }]
                            );
                        } finally {
                            setIsUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[{ flex: 1, backgroundColor: theme.background }]}>
            {/* Search Bar */}
            <View style={{ padding: 20, paddingBottom: 0 }}>
                <View style={[{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: theme.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                }]}>
                    <Search size={20} color={theme.textSecondary} />
                    <TextInput
                        placeholder={t('searchMedicines') || 'Search medicines...'}
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 16,
                            color: theme.text
                        }]}
                    />
                </View>
            </View>

            {/* Category Tabs */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((category) => (
                        <CategoryTab
                            key={category.key}
                            title={category.title}
                            count={category.count}
                            isActive={activeTab === category.key}
                            onPress={() => setActiveTab(category.key)}
                            isDark={isDark}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Medicine List */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                        progressBackgroundColor={theme.card}
                    />
                }
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                        <Text style={[{ color: theme.textSecondary }]}>
                            {t('loading') || 'Loading medicines...'}
                        </Text>
                    </View>
                ) : filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine) => (
                        <MedicineItem
                            key={medicine.id}
                            medicine={medicine}
                            onPress={() => handleMedicinePress(medicine)}
                            onMenuPress={() => handleMedicineMenu(medicine)}
                            isDark={isDark}
                        />
                    ))
                ) : (
                    <EmptyState
                        isDark={isDark}
                        t={t as (key: string) => string}
                        onAddMedicine={handleAddMedicine}
                    />
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
                onPress={handleAddMedicine}
                style={[{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    backgroundColor: theme.primary,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                }]}
                activeOpacity={0.8}
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>

            {/* Context Menu Modal */}
            <MedicineContextMenu
                visible={showContextMenu}
                medicine={selectedMedicine}
                onClose={closeContextMenu}
                onEdit={handleEditMedicine}
                onDelete={handleDeleteMedicine}
                onTogglePause={handleTogglePause}
                isDark={isDark}
                t={t as (key: string) => string}
            />
        </View>
    );
};

export default MedicinesScreen;