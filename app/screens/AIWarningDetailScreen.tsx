import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { AlertTriangle, Shield, Clock, X, ChevronLeft, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import {AiWarningResponse, WarningSeverity} from "@/app/services/ai";

type AIWarningDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIWarningDetail'>;
type AIWarningDetailScreenRouteProp = RouteProp<RootStackParamList, 'AIWarningDetail'>;

interface AIWarningDetailScreenProps {
    navigation: AIWarningDetailScreenNavigationProp;
    route: AIWarningDetailScreenRouteProp;
}

const AIWarningDetailScreen: React.FC<AIWarningDetailScreenProps> = ({ navigation, route }) => {
    const { warning } = route.params as { warning: AiWarningResponse };

    const { isDark } = useTheme();
    const { t } = useLanguage();

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
        <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Header */}
            <View className={`flex-row items-center p-4 border-b ${
                isDark ? 'border-slate-700' : 'border-gray-200'
            }`}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={isDark ? '#F8FAFC' : '#1F2937'} />
                </TouchableOpacity>

                <Text className={`text-xl font-bold flex-1 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {t('warningDetails') || 'Warning Details'}
                </Text>

                <View className="w-6" /> {/* Spacer for alignment */}
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Severity Badge */}
                <View className={`flex-row items-center p-4 rounded-xl mb-6 ${
                    severityConfig.bgColor
                }`}>
                    <IconComponent size={24} color={severityConfig.color} />
                    <Text className={`ml-3 text-lg font-bold`} style={{ color: severityConfig.color }}>
                        {severityConfig.label}
                    </Text>
                </View>

                {/* Warning Message */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {t('warning') || 'Warning'}
                    </Text>
                    <Text className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {warning.evaluationResult.message}
                    </Text>
                </View>

                {/* Details */}
                {warning.evaluationResult.details && (
                    <View className="mb-6">
                        <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            {t('details') || 'Details'}
                        </Text>
                        <Text className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {warning.evaluationResult.details}
                        </Text>
                    </View>
                )}

                {/* Affected Medicines */}
                <View className="mb-6">
                    <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {t('affectedMedicines') || 'Affected Medicines'}
                    </Text>
                    <View className="flex-row flex-wrap">
                        <View className={`px-4 py-2 rounded-xl mr-3 mb-2 ${
                            isDark ? 'bg-slate-800' : 'bg-gray-100'
                        }`}>
                            <Text className={`text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                {warning.medicineName}
                            </Text>
                        </View>
                        {warning.evaluationResult.targetMedicineName && (
                            <View className={`px-4 py-2 rounded-xl mr-3 mb-2 ${
                                isDark ? 'bg-slate-800' : 'bg-gray-100'
                            }`}>
                                <Text className={`text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                    {warning.evaluationResult.targetMedicineName}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* Additional Info */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            {t('detected') || 'Detected'}
                        </Text>
                        <Text className={`text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {formatDate(warning.createdAt)}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default AIWarningDetailScreen;