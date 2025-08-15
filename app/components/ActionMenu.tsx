import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet
} from 'react-native';
import { Edit3, Trash2 } from 'lucide-react-native';

interface ActionMenuProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDark: boolean;
    t: any;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
                                                   visible,
                                                   onClose,
                                                   onEdit,
                                                   onDelete,
                                                   isDark,
                                                   t
                                               }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.modalOverlay}
                onPress={onClose}
            >
                <View className={`absolute bottom-0 left-0 right-0 rounded-t-2xl p-4 ${
                    isDark ? 'bg-slate-800' : 'bg-white'
                }`}>
                    <TouchableOpacity
                        className={`flex-row items-center py-4 px-4 rounded-lg ${
                            isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                        onPress={onEdit}
                    >
                        <Edit3 size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                        <Text className={`ml-3 text-base ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                            {t('edit')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-row items-center py-4 px-4 rounded-lg mt-2 ${
                            isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                        onPress={onDelete}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text className="ml-3 text-base text-red-500">
                            {t('delete')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`py-4 rounded-lg items-center mt-4 ${
                            isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                        onPress={onClose}
                    >
                        <Text className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('cancel')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
});

export default ActionMenu;