import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Search, Plus, Pill, Clock, MoreVertical, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { UserStorageService } from '../services/user/UserService';
import { medicineService, MedicineResponse } from '../services/medicine/medicine/MedicineService';

// Navigation prop type
type MedicinesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTab'>;

interface MedicinesScreenProps {
    navigation: MedicinesScreenNavigationProp;
}

// Medicine Item Component with navigation
const MedicineItem: React.FC<{
    medicine: MedicineResponse;
    onPress: () => void;
    onMenuPress: () => void;
    isDark: boolean;
}> = ({ medicine, onPress, onMenuPress, isDark }) => {
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
        if (!medicine.isActive || !medicine.intakeSchedules.length) return 'Paused';

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

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`}
                              style={{ backgroundColor: status.color + '20' }}>
                            <Pill size={16} color={status.color} />
                        </View>
                        <Text className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {medicine.name}
                        </Text>
                    </View>
                    <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'} ml-11`}>
                        {medicine.formattedDosage || 'No dosage'} • {medicine.intakeSchedules.length}x daily
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onMenuPress}
                    className="p-2"
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <MoreVertical size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                </TouchableOpacity>
            </View>

            {/* Next Dose */}
            <View className="flex-row items-center justify-between ml-11">
                <View className="flex-row items-center">
                    <Clock size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                    <Text className={`text-sm ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Next: {getNextDose()}
                    </Text>
                </View>
                <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: status.color + '20' }}>
                    <Text className="text-xs font-medium" style={{ color: status.color }}>
                        {status.active}
                    </Text>
                </View>
            </View>

            {/* Allergy Warning */}
            {medicine.relatedAllergies && medicine.relatedAllergies.length > 0 && (
                <View className="flex-row items-center mt-3 ml-11 p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle size={14} color="#F59E0B" />
                    <Text className="text-xs text-amber-600 ml-1 font-medium">
                        Allergy Warning: {medicine.relatedAllergies.map(a => a.name).join(', ')}
                    </Text>
                </View>
            )}
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
}> = ({ title, count, isActive, onPress, isDark }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-4 py-2 rounded-full mr-3 ${
            isActive
                ? 'bg-indigo-500'
                : isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}
    >
        <Text className={`text-sm font-medium ${
            isActive
                ? 'text-white'
                : isDark ? 'text-slate-300' : 'text-gray-600'
        }`}>
            {title} ({count})
        </Text>
    </TouchableOpacity>
);

// Empty State Component
const EmptyState: React.FC<{
    isDark: boolean;
    t: (key: string) => string;
    onAddMedicine: () => void;
}> = ({ isDark, t, onAddMedicine }) => (
    <View className={`flex-1 items-center justify-center p-8 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl mt-4`}>
        <Pill size={64} color={isDark ? '#64748B' : '#9CA3AF'} />
        <Text className={`text-xl font-semibold mt-4 mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
            {t('noMedicines') || 'No medicines yet'}
        </Text>
        <Text className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-6`}>
            {t('addFirstMedicineDesc') || 'Add your first medicine to start tracking your health journey'}
        </Text>
        <TouchableOpacity onPress={onAddMedicine} className="bg-indigo-500 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">
                {t('addMedicine') || 'Add Medicine'}
            </Text>
        </TouchableOpacity>
    </View>
);

// Main Medicines Screen
const MedicinesScreen: React.FC<MedicinesScreenProps> = ({ navigation }) => {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadMedicines = async (useCache = true) => {
        try {
            setLoading(true);
            const user = await UserStorageService.getStoredUser();
            if (!user) return;

            const userMedicines = await medicineService.getMedicines(user.id, useCache);
            setMedicines(userMedicines);
        } catch (error) {
            console.error('Error loading medicines:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load medicines when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadMedicines(false); // Always refresh when screen comes into focus
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadMedicines(false);
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
        // You can implement a bottom sheet menu here or navigate directly to edit
        navigation.navigate('EditMedicine', { medicineId: medicine.id });
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            {/* Search Bar */}
            <View className="p-5 pb-0">
                <View className={`flex-row items-center px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                    <Search size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                    <TextInput
                        placeholder={t('searchMedicines') || 'Search medicines...'}
                        placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className={`flex-1 ml-3 text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}
                    />
                </View>
            </View>

            {/* Category Tabs */}
            <View className="px-5 py-4">
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
                className="flex-1 px-5"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6366F1']}
                        tintColor={isDark ? '#6366F1' : '#6366F1'}
                        progressBackgroundColor={isDark ? '#1E293B' : '#FFFFFF'}
                    />
                }
            >
                {loading ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
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
                className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
                style={{ elevation: 8 }}
                activeOpacity={0.8}
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
};

export default MedicinesScreen;