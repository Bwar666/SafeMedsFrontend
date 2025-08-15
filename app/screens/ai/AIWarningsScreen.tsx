import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { AlertTriangle, Shield, Info, Clock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserStorageService } from '@/app/services/user';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { AiWarningResponse, aiWarningService, WarningSeverity } from "@/app/services/ai";

type WarningLevel = 'critical' | 'high' | 'medium' | 'low';
type FilterType = 'all' | 'unseen' | 'seen' | 'critical' | 'high' | 'medium' | 'low';
type AIWarningsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const WarningItem: React.FC<{
    warning: AiWarningResponse;
    onMarkSeen: () => void;
    isDark: boolean;
    t: (key: string) => string;
    onViewDetails: () => void;
}> = ({ warning, onMarkSeen, isDark, t, onViewDetails }) => {
    const { theme } = useTheme();

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

    // Truncate long messages with an ellipsis
    const truncateMessage = (message: string, maxLength = 120) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <View
            className={`rounded-xl mb-4 overflow-hidden shadow-sm`}
            style={{ backgroundColor: theme.card, borderLeftWidth: 4, borderLeftColor: config.color }}
        >
            {/* Header and content - clickable for details */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onViewDetails}
            >
                {/* Header with severity badge */}
                <View
                    className={`py-3 px-4 flex-row items-center`}
                    style={{ backgroundColor: isDark ? config.darkBgColor : config.bgColor }}
                >
                    <View className="flex-row items-center flex-1">
                        <IconComponent size={18} color={config.color} />
                        <Text className={`text-sm font-semibold ml-2`} style={{ color: config.color }}>
                            {config.label}
                        </Text>
                    </View>

                    <View className="flex-row items-center">
                        {warning.seen ? (
                            <Eye size={14} color={theme.textSecondary} />
                        ) : (
                            <EyeOff size={14} color={theme.textSecondary} />
                        )}
                        <Text className={`text-xs ml-1`} style={{ color: theme.textSecondary }}>
                            {formatTime(warning.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View className="p-4">
                    <Text
                        className={`text-base font-semibold mb-2`}
                        style={{ color: theme.text }}
                        numberOfLines={3}
                    >
                        {truncateMessage(warning.evaluationResult.message)}
                    </Text>

                    <View className="flex-row items-center justify-between mt-3">
                        <View className="flex-1">
                            <Text className={`text-xs font-medium mb-1`} style={{ color: theme.textSecondary }}>
                                {t('affectedMedicines') || 'Affected medicines'}:
                            </Text>
                            <View className="flex-row flex-wrap">
                                <View className={`px-3 py-1 rounded-full mr-2 mb-1`} style={{ backgroundColor: theme.surface }}>
                                    <Text className={`text-sm`} style={{ color: theme.textSecondary }}>
                                        {warning.medicineName}
                                    </Text>
                                </View>
                                {warning.evaluationResult.targetMedicineName && (
                                    <View className={`px-3 py-1 rounded-full mb-1`} style={{ backgroundColor: theme.surface }}>
                                        <Text className={`text-sm`} style={{ color: theme.textSecondary }}>
                                            {warning.evaluationResult.targetMedicineName}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Mark as seen button - separate from the detail view */}
            <TouchableOpacity
                onPress={onMarkSeen}
                className={`flex-row items-center justify-center mx-4 mb-4 py-2 rounded-lg`}
                style={{ backgroundColor: warning.seen
                        ? (isDark ? 'rgba(52, 211, 153, 0.3)' : '#ECFDF5')
                        : theme.surface }}
            >
                {warning.seen ? (
                    <Eye size={18} color={isDark ? '#34D399' : '#10B981'} />
                ) : (
                    <EyeOff size={18} color={theme.textSecondary} />
                )}
                <Text className={`ml-2`} style={{ color: warning.seen
                        ? (isDark ? '#34D399' : '#10B981')
                        : theme.textSecondary }}>
                    {warning.seen
                        ? t('markedSeen') || 'Seen'
                        : t('markSeen') || 'Mark as Seen'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const FilterTab: React.FC<{
    level: FilterType;
    label: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
    color?: string;
    isDark: boolean;
    icon?: React.ReactNode;
}> = ({ level, label, count, isActive, onPress, color, isDark, icon }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`px-3 py-2 rounded-lg mr-2 mb-2 flex-row items-center`}
            style={{ backgroundColor: isActive ? theme.primary : theme.surface }}
        >
            {icon && <View className="mr-1">{icon}</View>}
            <Text className={`text-s font-medium`} style={{ color: isActive ? 'white' : theme.textSecondary }}>
                {label}
            </Text>
            {count > 0 && (
                <View className={`ml-1 px-1.5 py-0.5 rounded-full`}
                      style={{ backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : theme.border }}>
                    <Text className={`text-[11px]`} style={{ color: isActive ? 'white' : theme.textSecondary }}>
                        {count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const AIStatusBanner: React.FC<{ isDark: boolean; t: (key: string) => string }> = ({ isDark, t }) => {
    const { theme } = useTheme();

    return (
        <View className={`mx-4 p-4 rounded-xl mb-4 shadow-sm`} style={{ backgroundColor: theme.card }}>
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-indigo-500/10 items-center justify-center mr-3">
                    <Shield size={20} color="#6366F1" />
                </View>
                <View className="flex-1">
                    <Text className={`text-base font-semibold`} style={{ color: theme.text }}>
                        {t('aiProtection') || 'AI Protection Active'}
                    </Text>
                    <Text className={`text-sm`} style={{ color: theme.textSecondary }}>
                        {t('aiProtectionDesc') || 'Monitoring your medicines for potential risks'}
                    </Text>
                </View>
                <View className="mb-6 w-3 h-3 rounded-full bg-emerald-500" />
            </View>
        </View>
    );
};

const AIWarningsScreen: React.FC = () => {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation<AIWarningsScreenNavigationProp>();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
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

    const handleMarkSeen = async (warningId: string) => {
        if (!userId) return;

        try {
            await aiWarningService.markWarningAsSeen(warningId, userId);

            // Update the warning in state to mark it as seen
            setWarnings(prev => prev.map(w =>
                w.id === warningId ? { ...w, seen: true } : w
            ));
        } catch (error) {
            console.error('Error marking warning as seen:', error);
        }
    };

    const handleViewDetails = (warning: AiWarningResponse) => {
        navigation.navigate('AIWarningDetail', { warning });
    };

    const getWarningCount = (level: FilterType) => {
        if (level === 'all') return warnings.length;
        if (level === 'unseen') return warnings.filter(w => !w.seen).length;
        if (level === 'seen') return warnings.filter(w => w.seen).length;

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

    const filterTabs = useMemo(() => [
        {
            key: 'all' as const,
            label: t('all') || 'All',
            count: getWarningCount('all'),
            color: theme.primary,
            icon: <View className="w-2 h-2 rounded-full bg-indigo-500" />
        },
        {
            key: 'unseen' as const,
            label: t('unseen') || 'Unseen',
            count: getWarningCount('unseen'),
            color: '#3B82F6',
            icon: <EyeOff size={12} color={isDark ? '#93C5FD' : '#3B82F6'} />
        },
        {
            key: 'seen' as const,
            label: t('seen') || 'Seen',
            count: getWarningCount('seen'),
            color: '#10B981',
            icon: <Eye size={12} color={isDark ? '#34D399' : '#10B981'} />
        },
        {
            key: 'critical' as const,
            label: t('critical') || 'Critical',
            count: getWarningCount('critical'),
            color: '#EF4444',
            icon: <View className="w-2 h-2 rounded-full bg-red-500" />
        },
        {
            key: 'high' as const,
            label: t('high') || 'High',
            count: getWarningCount('high'),
            color: '#F59E0B',
            icon: <View className="w-2 h-2 rounded-full bg-amber-500" />
        },
        {
            key: 'medium' as const,
            label: t('medium') || 'Medium',
            count: getWarningCount('medium'),
            color: '#8B5CF6',
            icon: <View className="w-2 h-2 rounded-full bg-violet-500" />
        },
        {
            key: 'low' as const,
            label: t('low') || 'Low',
            count: getWarningCount('low'),
            color: '#10B981',
            icon: <View className="w-2 h-2 rounded-full bg-emerald-500" />
        },
    ], [warnings, activeFilter, isDark]);

    const filteredWarnings = useMemo(() => {
        if (activeFilter === 'all') return warnings;
        if (activeFilter === 'unseen') return warnings.filter(w => !w.seen);
        if (activeFilter === 'seen') return warnings.filter(w => w.seen);

        return warnings.filter(warning => {
            const severity = warning.evaluationResult.severity;
            return (
                (activeFilter === 'critical' && severity === WarningSeverity.CRITICAL) ||
                (activeFilter === 'high' && severity === WarningSeverity.HIGH) ||
                (activeFilter === 'medium' && severity === WarningSeverity.MODERATE) ||
                (activeFilter === 'low' && severity === WarningSeverity.LOW)
            );
        });
    }, [warnings, activeFilter]);

    const hasVisibleWarnings = filteredWarnings.length > 0;

    return (
        <View className={`flex-1`} style={{ backgroundColor: theme.background }}>
            <AIStatusBanner isDark={isDark} t={t as (key: string) => string} />

            {/* Compact Filter Tabs */}
            <View className="px-4 pb-2">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                >
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
                            icon={tab.icon}
                        />
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1 px-4"
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
                    <View className="flex-1 justify-center items-center py-20">
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text className={`mt-4`} style={{ color: theme.textSecondary }}>
                            {t('loadingWarnings') || 'Loading warnings...'}
                        </Text>
                    </View>
                ) : filteredWarnings.length > 0 ? (
                    filteredWarnings.map((warning) => (
                        <WarningItem
                            key={warning.id}
                            warning={warning}
                            onMarkSeen={() => handleMarkSeen(warning.id)}
                            isDark={isDark}
                            t={t as (key: string) => string}
                            onViewDetails={() => handleViewDetails(warning)}
                        />
                    ))
                ) : (
                    <View className={`flex-1 items-center justify-center p-8 rounded-xl mt-4`}
                          style={{ backgroundColor: theme.card }}>
                        <Shield size={64} color={theme.textSecondary} />
                        <Text className={`text-xl font-semibold mt-4 mb-2`} style={{ color: theme.text }}>
                            {t('noWarnings') || 'No warnings'}
                        </Text>
                        <Text className={`text-sm text-center`} style={{ color: theme.textSecondary }}>
                            {t('noWarningsDesc') || 'Your medicines are safe and no warnings detected'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default AIWarningsScreen;