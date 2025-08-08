import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { AlertTriangle, Shield, Info, Clock, X, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserStorageService } from '@/app/services/user';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {AiWarningResponse, aiWarningService, WarningSeverity,} from "@/app/services/ai";



type WarningLevel = 'critical' | 'high' | 'medium' | 'low';
type AIWarningsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const WarningItem: React.FC<{
    warning: AiWarningResponse;
    onDismiss?: () => void;
    onViewDetails: () => void;
    isDark: boolean;
    t: (key: string) => string;
}> = ({ warning, onDismiss, onViewDetails, isDark, t }) => {
    const getWarningLevel = (severity: WarningSeverity): WarningLevel => {
        switch (severity) {
            case WarningSeverity.CRITICAL: return 'critical';
            case WarningSeverity.HIGH: return 'high';
            case WarningSeverity.MODERATE: return 'medium';
            default: return 'low';
        }
    };

    const level = getWarningLevel(warning.evaluationResult.severity);

    const levelConfig = {
        critical: {
            color: '#EF4444',
            bgColor: '#FEF2F2',
            darkBgColor: '#7F1D1D',
            icon: AlertTriangle,
            label: t('critical') || 'Critical'
        },
        high: {
            color: '#F59E0B',
            bgColor: '#FFFBEB',
            darkBgColor: '#78350F',
            icon: AlertTriangle,
            label: t('highPriority') || 'High Priority'
        },
        medium: {
            color: '#8B5CF6',
            bgColor: '#F3E8FF',
            darkBgColor: '#581C87',
            icon: Info,
            label: t('mediumPriority') || 'Medium Priority'
        },
        low: {
            color: '#10B981',
            bgColor: '#ECFDF5',
            darkBgColor: '#064E3B',
            icon: Shield,
            label: t('lowPriority') || 'Low Priority'
        }
    };

    const config = levelConfig[level];
    const IconComponent = config.icon;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutesAgo') || 'min ago'}`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('hoursAgo') || 'hr ago'}`;
        return `${Math.floor(diffInMinutes / 1440)} ${t('daysAgo') || 'days ago'}`;
    };

    return (
        <View className={`rounded-xl mb-3 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <TouchableOpacity
                onPress={onViewDetails}
                activeOpacity={0.8}
            >
                {/* Header with severity badge */}
                <View
                    className={`py-2 px-4 flex-row items-center ${
                        isDark ? config.darkBgColor : config.bgColor
                    }`}
                >
                    <IconComponent size={16} color={config.color} />
                    <Text className={`text-sm font-medium ml-2`} style={{ color: config.color }}>
                        {config.label}
                    </Text>
                    <View className="flex-1" />
                    <View className="flex-row items-center">
                        <Clock size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                        <Text className={`text-xs ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatTime(warning.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View className="p-4">
                    <Text className={`text-base font-semibold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {warning.evaluationResult.message}
                    </Text>

                    <View className="flex-row items-center justify-between mt-3">
                        <View>
                            <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                                {t('affectedMedicines') || 'Affected medicines'}:
                            </Text>
                            <View className="flex-row flex-wrap">
                                <View className={`px-3 py-1 rounded-full mr-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                    <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {warning.medicineName}
                                    </Text>
                                </View>
                                {warning.evaluationResult.targetMedicineName && (
                                    <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                        <Text className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {warning.evaluationResult.targetMedicineName}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View className="flex-row items-center">
                            {onDismiss && (
                                <TouchableOpacity
                                    onPress={onDismiss}
                                    className="p-2 mr-1"
                                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                >
                                    <X size={18} color={isDark ? '#94A3B8' : '#6B7280'} />
                                </TouchableOpacity>
                            )}
                            <ChevronRight size={18} color={isDark ? '#94A3B8' : '#6B7280'} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

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

const AIStatusBanner: React.FC<{ isDark: boolean; t: (key: string) => string }> = ({ isDark, t }) => (
    <View className={`mx-5 p-4 rounded-xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
        <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                <Shield size={20} color="#6366F1" />
            </View>
            <View className="flex-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('aiProtection') || 'AI Protection Active'}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('aiProtectionDesc') || 'Monitoring your medicines for potential risks'}
                </Text>
            </View>
            <View className="w-3 h-3 rounded-full bg-emerald-500" />
        </View>
    </View>
);

const AIWarningsScreen: React.FC = () => {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation<AIWarningsScreenNavigationProp>();
    const [activeFilter, setActiveFilter] = useState<WarningLevel | 'all'>('all');
    const [warnings, setWarnings] = useState<AiWarningResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

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

    const loadWarnings = async (useCache = true) => {
        if (!userId) return;

        try {
            setLoading(true);
            const warnings = await aiWarningService.getAllWarnings(userId, useCache);
            setWarnings(warnings);
        } catch (error) {
            console.error('Error loading warnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadWarnings(false);
    }, [userId]);

    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if (userId) {
            loadWarnings();
        }
    }, [userId]);

    const handleDismissWarning = async (warningId: string) => {
        if (!userId) return;

        try {
            await aiWarningService.markWarningAsSeen(warningId, userId);
            setWarnings(prev => prev.filter(w => w.id !== warningId));
        } catch (error) {
            console.error('Error dismissing warning:', error);
        }
    };

    const handleViewDetails = (warning: AiWarningResponse) => {
        navigation.navigate('AIWarningDetail', { warning });
    };

    const getWarningCount = (level: WarningLevel | 'all') => {
        if (level === 'all') return warnings.length;
        return warnings.filter(w => {
            const severity = w.evaluationResult.severity;
            return (
                (level === 'critical' && severity === WarningSeverity.CRITICAL) ||
                (level === 'high' && severity === WarningSeverity.HIGH) ||
                (level === 'medium' && severity === WarningSeverity.MODERATE) ||
                (level === 'low' && severity === WarningSeverity.LOW)
            );
        }).length;
    };

    const filterTabs = [
        { key: 'all' as const, label: t('all') || 'All', count: getWarningCount('all') },
        { key: 'critical' as const, label: t('critical') || 'Critical', count: getWarningCount('critical'), color: '#EF4444' },
        { key: 'high' as const, label: t('high') || 'High', count: getWarningCount('high'), color: '#F59E0B' },
        { key: 'medium' as const, label: t('medium') || 'Medium', count: getWarningCount('medium'), color: '#8B5CF6' },
        { key: 'low' as const, label: t('low') || 'Low', count: getWarningCount('low'), color: '#10B981' },
    ];

    const filteredWarnings = warnings.filter(warning => {
        if (activeFilter === 'all') return true;

        const severity = warning.evaluationResult.severity;
        return (
            (activeFilter === 'critical' && severity === WarningSeverity.CRITICAL) ||
            (activeFilter === 'high' && severity === WarningSeverity.HIGH) ||
            (activeFilter === 'medium' && severity === WarningSeverity.MODERATE) ||
            (activeFilter === 'low' && severity === WarningSeverity.LOW)
        );
    });

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
            <AIStatusBanner isDark={isDark} t={t as (key: string) => string} />
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
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text className={`mt-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {t('loadingWarnings') || 'Loading warnings...'}
                        </Text>
                    </View>
                ) : filteredWarnings.length > 0 ? (
                    filteredWarnings.map((warning) => (
                        <WarningItem
                            key={warning.id}
                            warning={warning}
                            onDismiss={() => handleDismissWarning(warning.id)}
                            onViewDetails={() => handleViewDetails(warning)}
                            isDark={isDark}
                            t={t as (key: string) => string}
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