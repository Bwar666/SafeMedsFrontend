import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AlertTriangle, Shield, Info, Clock, X, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Warning Priority Types
type WarningLevel = 'critical' | 'high' | 'medium' | 'low';

// Warning Item Component
const WarningItem: React.FC<{
    level: WarningLevel;
    title: string;
    description: string;
    medicines: string[];
    timestamp: string;
    onDismiss?: () => void;
    onViewDetails: () => void;
    isDark: boolean;
}> = ({ level, title, description, medicines, timestamp, onDismiss, onViewDetails, isDark }) => {
    const levelConfig = {
        critical: {
            color: '#EF4444',
            bgColor: '#FEF2F2',
            darkBgColor: '#7F1D1D',
            icon: AlertTriangle,
            label: 'Critical'
        },
        high: {
            color: '#F59E0B',
            bgColor: '#FFFBEB',
            darkBgColor: '#78350F',
            icon: AlertTriangle,
            label: 'High Priority'
        },
        medium: {
            color: '#8B5CF6',
            bgColor: '#F3E8FF',
            darkBgColor: '#581C87',
            icon: Info,
            label: 'Medium Priority'
        },
        low: {
            color: '#10B981',
            bgColor: '#ECFDF5',
            darkBgColor: '#064E3B',
            icon: Shield,
            label: 'Low Priority'
        }
    };

    const config = levelConfig[level];
    const IconComponent = config.icon;

    return (
        <TouchableOpacity
            onPress={onViewDetails}
            className={`p-4 rounded-xl mb-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
        >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center flex-1">
                    <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: isDark ? config.darkBgColor : config.bgColor }}
                    >
                        <IconComponent size={16} color={config.color} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <Text className={`text-xs font-medium px-2 py-1 rounded-full mr-2`}
                                  style={{
                                      backgroundColor: config.color + '20',
                                      color: config.color
                                  }}>
                                {config.label}
                            </Text>
                            <View className="flex-row items-center">
                                <Clock size={12} color={isDark ? '#94A3B8' : '#6B7280'} />
                                <Text className={`text-xs ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {timestamp}
                                </Text>
                            </View>
                        </View>
                        <Text className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {title}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center">
                    {onDismiss && (
                        <TouchableOpacity onPress={onDismiss} className="p-1 mr-1">
                            <X size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                        </TouchableOpacity>
                    )}
                    <ChevronRight size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                </View>
            </View>

            {/* Description */}
            <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'} mb-3 ml-11`}>
                {description}
            </Text>

            {/* Affected Medicines */}
            <View className="ml-11">
                <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-2`}>
                    Affected medicines:
                </Text>
                <View className="flex-row flex-wrap">
                    {medicines.map((medicine, index) => (
                        <View
                            key={index}
                            className={`px-2 py-1 rounded-full mr-2 mb-1 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                {medicine}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Filter Tab Component
const FilterTab: React.FC<{
    level: WarningLevel | 'all';
    label: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
    color?: string;
    isDark: boolean;
}> = ({ level, label, count, isActive, onPress, color, isDark }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-4 py-2 rounded-full mr-3 ${
            isActive
                ? 'bg-indigo-500'
                : isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}
    >
        <View className="flex-row items-center">
            {color && (
                <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                />
            )}
            <Text className={`text-sm font-medium ${
                isActive
                    ? 'text-white'
                    : isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
                {label} ({count})
            </Text>
        </View>
    </TouchableOpacity>
);

// ai Status Banner
const AIStatusBanner: React.FC<{ isDark: boolean; t: (key: string) => string }> = ({ isDark, t }) => (
    <View className={`mx-5 p-4 rounded-xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
        <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                <Shield size={20} color="#6366F1" />
            </View>
            <View className="flex-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('aiProtection') || 'ai Protection Active'}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('aiProtectionDesc') || 'Monitoring your medicines for potential risks'}
                </Text>
            </View>
            <View className="w-3 h-3 rounded-full bg-emerald-500" />
        </View>
    </View>
);

// Main ai Warnings Screen
const AIWarningsScreen: React.FC = () => {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState<WarningLevel | 'all'>('all');

    // Mock warnings data
    const warnings = [
        {
            id: '1',
            level: 'critical' as WarningLevel,
            title: 'Drug Interaction Alert',
            description: 'Metformin and Lisinopril may interact and increase risk of lactic acidosis. Monitor kidney function closely.',
            medicines: ['Metformin', 'Lisinopril'],
            timestamp: '2 minutes ago',
            dismissed: false
        },
        {
            id: '2',
            level: 'high' as WarningLevel,
            title: 'Allergy Warning',
            description: 'You are allergic to Penicillin. This medication should be avoided to prevent allergic reactions.',
            medicines: ['Penicillin'],
            timestamp: '1 hour ago',
            dismissed: false
        },
        {
            id: '3',
            level: 'medium' as WarningLevel,
            title: 'Dosage Timing',
            description: 'Consider taking Metformin with meals to reduce gastrointestinal side effects.',
            medicines: ['Metformin'],
            timestamp: '3 hours ago',
            dismissed: false
        },
        {
            id: '4',
            level: 'low' as WarningLevel,
            title: 'Health Tip',
            description: 'Regular blood pressure monitoring is recommended when taking Lisinopril.',
            medicines: ['Lisinopril'],
            timestamp: '1 day ago',
            dismissed: false
        }
    ];

    const filterTabs = [
        { key: 'all' as const, label: 'All', count: warnings.length },
        { key: 'critical' as const, label: 'Critical', count: warnings.filter(w => w.level === 'critical').length, color: '#EF4444' },
        { key: 'high' as const, label: 'High', count: warnings.filter(w => w.level === 'high').length, color: '#F59E0B' },
        { key: 'medium' as const, label: 'Medium', count: warnings.filter(w => w.level === 'medium').length, color: '#8B5CF6' },
        { key: 'low' as const, label: 'Low', count: warnings.filter(w => w.level === 'low').length, color: '#10B981' },
    ];

    const filteredWarnings = warnings.filter(warning =>
        activeFilter === 'all' || warning.level === activeFilter
    );

    const handleDismissWarning = (warningId: string) => {
        // Handle dismissing a warning
        console.log('Dismiss warning:', warningId);
    };

    const handleViewDetails = (warningId: string) => {
        // Handle viewing warning details
        console.log('View details:', warningId);
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            {/* ai Status Banner */}
            <AIStatusBanner isDark={isDark} t={t as (key: string) => string} />

            {/* Filter Tabs */}
            <View className="px-5 pb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {filterTabs.map((tab) => (
                        <FilterTab
                            key={tab.key}
                            level={tab.key}
                            label={tab.label}
                            count={tab.count}
                            isActive={activeFilter === tab.key}
                            onPress={() => setActiveFilter(tab.key)}
                            color={tab.color}
                            isDark={isDark}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Warnings List */}
            <ScrollView className="flex-1 px-5">
                {filteredWarnings.length > 0 ? (
                    filteredWarnings.map((warning) => (
                        <WarningItem
                            key={warning.id}
                            level={warning.level}
                            title={warning.title}
                            description={warning.description}
                            medicines={warning.medicines}
                            timestamp={warning.timestamp}
                            onDismiss={() => handleDismissWarning(warning.id)}
                            onViewDetails={() => handleViewDetails(warning.id)}
                            isDark={isDark}
                        />
                    ))
                ) : (
                    <View className={`flex-1 items-center justify-center p-8 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl mt-4`}>
                        <Shield size={64} color={isDark ? '#64748B' : '#9CA3AF'} />
                        <Text className={`text-xl font-semibold mt-4 mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {t('noWarnings') || 'No warnings'}
                        </Text>
                        <Text className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('noWarningsDesc') || 'Your medicines are safe and no warnings detected'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default AIWarningsScreen;