import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { AlertTriangle, Shield, ChevronLeft, Lightbulb, HeartPulse, ArrowRightLeft, Pill } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {AiWarningResponse, WarningSeverity} from "@/app/services/ai";

type AIWarningDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIWarningDetail'>;
type AIWarningDetailScreenRouteProp = RouteProp<RootStackParamList, 'AIWarningDetail'>;

interface AIWarningDetailScreenProps {
    navigation: AIWarningDetailScreenNavigationProp;
    route: AIWarningDetailScreenRouteProp;
}

interface WarningDetails {
    reason: string;
    recommendation: string;
    mechanism: string;
    alternatives: string;
}

const DetailSection: React.FC<{
    title: string;
    content: string;
    icon: React.ReactNode;
    isDark: boolean;
}> = ({ title, content, icon, isDark }) => {
    const { theme } = useTheme();

    return (
        <View className="mb-6">
            <View className="flex-row items-center mb-3">
                {icon}
                <Text className={`ml-2 text-base font-semibold`} style={{ color: theme.text }}>
                    {title}
                </Text>
            </View>
            <View className={`p-4 rounded-xl`} style={{ backgroundColor: theme.surface }}>
                <Text className={`text-base`} style={{ color: theme.textSecondary }}>
                    {content}
                </Text>
            </View>
        </View>
    );
};

const MedicineBadge: React.FC<{ name: string; isDark: boolean }> = ({ name, isDark }) => {
    const { theme } = useTheme();

    return (
        <View className={`flex-row items-center px-4 py-2 rounded-xl mr-3 mb-2`} style={{ backgroundColor: theme.surface }}>
            <Pill size={16} color={theme.textSecondary} className="mr-2" />
            <Text className={`text-base`} style={{ color: theme.text }}>
                {name}
            </Text>
        </View>
    );
};

const AIWarningDetailScreen: React.FC<AIWarningDetailScreenProps> = ({ navigation, route }) => {
    const { warning } = route.params as { warning: AiWarningResponse };
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();

    // Parse the JSON details string
    const details: WarningDetails = warning.evaluationResult.details
        ? JSON.parse(warning.evaluationResult.details)
        : null;

    const getSeverityConfig = (severity: WarningSeverity) => {
        switch (severity) {
            case WarningSeverity.CRITICAL:
                return {
                    color: '#EF4444',
                    bgColor: isDark ? '#7F1D1D' : '#FEF2F2',
                    label: t('critical') || 'Critical',
                    icon: AlertTriangle
                };
            case WarningSeverity.HIGH:
                return {
                    color: '#F59E0B',
                    bgColor: isDark ? '#78350F' : '#FFFBEB',
                    label: t('highPriority') || 'High Priority',
                    icon: AlertTriangle
                };
            case WarningSeverity.MODERATE:
                return {
                    color: '#8B5CF6',
                    bgColor: isDark ? '#581C87' : '#F3E8FF',
                    label: t('mediumPriority') || 'Medium Priority',
                    icon: AlertTriangle
                };
            case WarningSeverity.LOW:
            default:
                return {
                    color: '#10B981',
                    bgColor: isDark ? '#064E3B' : '#ECFDF5',
                    label: t('lowPriority') || 'Low Priority',
                    icon: Shield
                };
        }
    };

    const severityConfig = getSeverityConfig(warning.evaluationResult.severity);
    const IconComponent = severityConfig.icon;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View className={`flex-1`} style={{ backgroundColor: theme.background }}>
            {/* Header */}
            <View className={`flex-row items-center p-4`} style={{ backgroundColor: theme.card }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 rounded-full"
                >
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>

                <Text className={`text-xl font-bold flex-1 text-center`} style={{ color: theme.text }}>
                    {t('warningDetails') || 'Warning Details'}
                </Text>

                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-4 pt-2">
                {/* Severity Badge */}
                <View className={`flex-row items-center p-4 rounded-xl mb-6`} style={{ backgroundColor: severityConfig.bgColor }}>
                    <IconComponent size={24} color={severityConfig.color} />
                    <Text className={`ml-3 text-lg font-bold`} style={{ color: severityConfig.color }}>
                        {severityConfig.label}
                    </Text>
                </View>

                {/* Warning Message */}
                <View className="mb-6">
                    <Text className={`text-base font-medium mb-2`} style={{ color: theme.textSecondary }}>
                        {t('warning') || 'Warning'}
                    </Text>
                    <View className={`p-4 rounded-xl`} style={{ backgroundColor: theme.surface }}>
                        <Text className={`text-lg font-semibold`} style={{ color: theme.text }}>
                            {warning.evaluationResult.message}
                        </Text>
                    </View>
                </View>

                {/* Affected Medicines */}
                <View className="mb-6">
                    <Text className={`text-base font-medium mb-3`} style={{ color: theme.textSecondary }}>
                        {t('affectedMedicines') || 'Affected Medicines'}
                    </Text>
                    <View className="flex-row flex-wrap">
                        <MedicineBadge name={warning.medicineName} isDark={isDark} />
                        {warning.evaluationResult.targetMedicineName && (
                            <MedicineBadge
                                name={warning.evaluationResult.targetMedicineName}
                                isDark={isDark}
                            />
                        )}
                    </View>
                </View>

                {/* Parsed Details */}
                {details && (
                    <View className="mb-6">
                        <Text className={`text-base font-medium mb-3`} style={{ color: theme.textSecondary }}>
                            {t('detailedAnalysis') || 'Detailed Analysis'}
                        </Text>

                        <DetailSection
                            title={t('reason') || 'Reason'}
                            content={details.reason}
                            icon={<Lightbulb size={20} color={theme.textSecondary} />}
                            isDark={isDark}
                        />

                        <DetailSection
                            title={t('recommendation') || 'Recommendation'}
                            content={details.recommendation}
                            icon={<HeartPulse size={20} color={theme.textSecondary} />}
                            isDark={isDark}
                        />

                        <DetailSection
                            title={t('mechanism') || 'Biological Mechanism'}
                            content={details.mechanism}
                            icon={<ArrowRightLeft size={20} color={theme.textSecondary} />}
                            isDark={isDark}
                        />

                        <DetailSection
                            title={t('alternatives') || 'Alternative Options'}
                            content={details.alternatives}
                            icon={<Pill size={20} color={theme.textSecondary} />}
                            isDark={isDark}
                        />
                    </View>
                )}

                {/* Detection Info */}
                <View className={`p-4 rounded-xl mb-6`} style={{ backgroundColor: theme.surface }}>
                    <View className="flex-row justify-between items-center">
                        <Text className={`text-sm font-medium`} style={{ color: theme.textSecondary }}>
                            {t('detected') || 'Detected'}
                        </Text>
                        <Text className={`text-base`} style={{ color: theme.text }}>
                            {formatDate(warning.createdAt)}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default AIWarningDetailScreen;