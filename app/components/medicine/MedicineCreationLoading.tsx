import React from 'react';
import {
    View,
    Text,
    Modal,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Shield, CheckCircle, Clock, Sparkles } from 'lucide-react-native';
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";

interface MedicineCreationLoadingProps {
    visible: boolean;
    currentStep: 'creating' | 'analyzing' | 'generating_warnings' | 'finalizing';
    medicineName: string;
}

const MedicineCreationLoading: React.FC<MedicineCreationLoadingProps> = ({
                                                                             visible,
                                                                             currentStep,
                                                                             medicineName,
                                                                         }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();
    const { width } = Dimensions.get('window');

    const getStepInfo = () => {
        switch (currentStep) {
            case 'creating':
                return {
                    icon: <CheckCircle size={32} color={theme.success} />,
                    title: t('creatingMedicine') || 'Creating Medicine',
                    description: t('addingMedicineToList') || `Adding ${medicineName} to your medicine list...`,
                    progress: 25,
                };
            case 'analyzing':
                return {
                    icon: <Sparkles size={32} color={theme.warning} />,
                    title: t('analyzingMedicine') || 'Analyzing Medicine',
                    description: t('aiAnalyzingInteractions') || 'Our AI is analyzing your medicine for potential interactions...',
                    progress: 50,
                };
            case 'generating_warnings':
                return {
                    icon: <Shield size={32} color={theme.primary} />,
                    title: t('generatingSafetyWarnings') || 'Generating Safety Warnings',
                    description: t('personalizedWarningsReady') || 'Getting your personalized warnings ready. This might take a minute...',
                    progress: 75,
                };
            case 'finalizing':
                return {
                    icon: <CheckCircle size={32} color={theme.success} />,
                    title: t('almostDone') || 'Almost Done',
                    description: t('finalizingMedicineSetup') || 'Finalizing your medicine setup and safety profile...',
                    progress: 90,
                };
            default:
                return {
                    icon: <ActivityIndicator size="large" color={theme.primary} />,
                    title: t('processing') || 'Processing',
                    description: t('pleaseWait') || 'Please wait...',
                    progress: 0,
                };
        }
    };

    const stepInfo = getStepInfo();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View className="flex-1 bg-black/50 items-center justify-center px-6">
                <View
                    style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        width: width * 0.85,
                        maxWidth: 400
                    }}
                    className="rounded-2xl p-8 shadow-2xl border"
                >
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View style={{ backgroundColor: theme.surface }} className="w-16 h-16 rounded-full items-center justify-center mb-4">
                            {stepInfo.icon}
                        </View>

                        <Text style={{ color: theme.text }} className="text-xl font-bold text-center mb-2">
                            {stepInfo.title}
                        </Text>

                        <Text style={{ color: theme.textSecondary }} className="text-sm text-center leading-relaxed">
                            {stepInfo.description}
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-6">
                        <View style={{ backgroundColor: theme.border }} className="h-2 rounded-full overflow-hidden">
                            <View
                                style={{
                                    backgroundColor: theme.primary,
                                    width: `${stepInfo.progress}%`
                                }}
                                className="h-full rounded-full transition-all duration-1000"
                            />
                        </View>

                        <Text style={{ color: theme.textSecondary }} className="text-xs text-center mt-2">
                            {stepInfo.progress}% {t('complete') || 'complete'}
                        </Text>
                    </View>

                    {/* Steps Indicator */}
                    <View className="flex-row items-center justify-between mb-6">
                        {['creating', 'analyzing', 'generating_warnings', 'finalizing'].map((step, index) => {
                            const isActive = step === currentStep;
                            const isCompleted = ['creating', 'analyzing', 'generating_warnings', 'finalizing']
                                .indexOf(currentStep) > index;

                            return (
                                <View key={step} className="flex-1 items-center">
                                    <View style={{
                                        backgroundColor: isActive
                                            ? theme.primary
                                            : isCompleted
                                                ? theme.success
                                                : theme.border
                                    }} className="w-3 h-3 rounded-full" />

                                    {index < 3 && (
                                        <View style={{
                                            backgroundColor: isCompleted ? theme.success : theme.border,
                                            transform: [{ translateX: 6 }]
                                        }} className="absolute top-1.5 left-1/2 w-full h-px" />
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Loading Animation */}
                    <View className="items-center">
                        <ActivityIndicator
                            size="large"
                            color={theme.primary}
                        />
                    </View>

                    {/* AI Warning Info */}
                    {currentStep === 'generating_warnings' && (
                        <View style={{ backgroundColor: `${theme.primary}20` }} className="mt-6 p-4 rounded-xl">
                            <View className="flex-row items-start">
                                <Shield size={16} color={theme.primary} />
                                <View className="ml-3 flex-1">
                                    <Text style={{ color: theme.primary }} className="text-sm font-medium mb-1">
                                        {t('aiSafetyAnalysis') || 'AI Safety Analysis'}
                                    </Text>
                                    <Text style={{ color: theme.primary }} className="text-xs leading-relaxed">
                                        {t('aiCheckingInteractions') || 'Our AI is checking for drug interactions, allergy conflicts, and generating personalized safety warnings based on your profile.'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Time Estimate */}
                    <View className="mt-4 items-center">
                        <View className="flex-row items-center">
                            <Clock size={14} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary }} className="text-xs ml-2">
                                {currentStep === 'generating_warnings'
                                    ? (t('warningTimeEstimate') || 'This usually takes 30-60 seconds')
                                    : (t('almostReady') || 'Almost ready...')
                                }
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default MedicineCreationLoading;