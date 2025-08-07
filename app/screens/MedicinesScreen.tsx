import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, Plus, Pill, Clock, MoreVertical, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Add navigation prop type
type MedicinesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTab'>;

interface MedicinesScreenProps {
    navigation: MedicinesScreenNavigationProp;
}

// Medicine Item Component
const MedicineItem: React.FC<{
    name: string;
    dosage: string;
    frequency: string;
    nextDose: string;
    status: 'active' | 'paused' | 'completed';
    allergies?: string[];
    isDark: boolean;
}> = ({ name, dosage, frequency, nextDose, status, allergies, isDark }) => {
    const statusColors = {
        active: '#10B981',
        paused: '#F59E0B',
        completed: '#6B7280',
    };

    const statusText = {
        active: 'Active',
        paused: 'Paused',
        completed: 'Completed',
    };

    return (
        <TouchableOpacity className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`}
                              style={{ backgroundColor: statusColors[status] + '20' }}>
                            <Pill size={16} color={statusColors[status]} />
                        </View>
                        <Text className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {name}
                        </Text>
                    </View>
                    <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'} ml-11`}>
                        {dosage} • {frequency}
                    </Text>
                </View>
                <TouchableOpacity className="p-2">
                    <MoreVertical size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                </TouchableOpacity>
            </View>

            {/* Next Dose */}
            <View className="flex-row items-center justify-between ml-11">
                <View className="flex-row items-center">
                    <Clock size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                    <Text className={`text-sm ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Next: {nextDose}
                    </Text>
                </View>
                <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: statusColors[status] + '20' }}>
                    <Text className="text-xs font-medium" style={{ color: statusColors[status] }}>
                        {statusText[status]}
                    </Text>
                </View>
            </View>

            {/* Allergy Warning */}
            {allergies && allergies.length > 0 && (
                <View className="flex-row items-center mt-3 ml-11 p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle size={14} color="#F59E0B" />
                    <Text className="text-xs text-amber-600 ml-1 font-medium">
                        Allergy Warning: {allergies.join(', ')}
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

    // Mock data
    const medicines = [
        {
            name: 'Metformin',
            dosage: '500mg',
            frequency: '2x daily',
            nextDose: '2:00 PM',
            status: 'active' as const,
            allergies: []
        },
        {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: '1x daily',
            nextDose: '8:00 AM',
            status: 'completed' as const,
            allergies: []
        },
        {
            name: 'Penicillin',
            dosage: '250mg',
            frequency: '3x daily',
            nextDose: 'Paused',
            status: 'paused' as const,
            allergies: ['Penicillin allergy detected']
        },
    ];

    const categories = [
        { key: 'all', title: 'All', count: medicines.length },
        { key: 'active', title: 'Active', count: medicines.filter(m => m.status === 'active').length },
        { key: 'paused', title: 'Paused', count: medicines.filter(m => m.status === 'paused').length },
        { key: 'completed', title: 'Completed', count: medicines.filter(m => m.status === 'completed').length },
    ];

    const filteredMedicines = medicines.filter(medicine => {
        const matchesTab = activeTab === 'all' || medicine.status === activeTab;
        const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleAddMedicine = () => {
        navigation.navigate('AddMedicine');
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
            <ScrollView className="flex-1 px-5">
                {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine, index) => (
                        <MedicineItem
                            key={index}
                            name={medicine.name}
                            dosage={medicine.dosage}
                            frequency={medicine.frequency}
                            nextDose={medicine.nextDose}
                            status={medicine.status}
                            allergies={medicine.allergies.length > 0 ? medicine.allergies : undefined}
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
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
};

export default MedicinesScreen;