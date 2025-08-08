import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Animated,
    Keyboard,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { medicalSearchService, SearchCategory, SearchSuggestion } from '../services/search/MedicalSearchService';

// Convert SearchSuggestion to SearchResult for component compatibility
interface SearchResult {
    id: string;
    name: string;
    description?: string;
    category?: string;
}

interface SearchDropdownProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    searchType: 'medicine' | 'condition';
    isDark: boolean;
    isRTL: boolean;
    onSelectResult?: (result: SearchResult) => void;
    disabled?: boolean;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
                                                           value,
                                                           onChangeText,
                                                           placeholder,
                                                           searchType,
                                                           isDark,
                                                           isRTL,
                                                           onSelectResult,
                                                           disabled = false,
                                                       }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownAnimation = useRef(new Animated.Value(0)).current;
    const searchTimeoutRef = useRef<number | null>(null);
    // Convert SearchSuggestion to SearchResult
    const convertToSearchResult = (suggestion: SearchSuggestion): SearchResult => ({
        id: suggestion.value,
        name: suggestion.displayName,
        description: suggestion.description,
        category: suggestion.category
    });

    // Search using your actual MedicalSearchService
    const searchMedicines = async (query: string): Promise<SearchResult[]> => {
        try {
            const response = await medicalSearchService.searchMedicines(query, 10);
            return response.suggestions.map(convertToSearchResult);
        } catch (error) {
            console.log('Medicine search failed, using fallback:', error);
            // Fallback to popular suggestions
            const suggestions = await medicalSearchService.getSearchSuggestions(SearchCategory.MEDICINES, query);
            return suggestions.map(convertToSearchResult);
        }
    };

    const searchConditions = async (query: string): Promise<SearchResult[]> => {
        try {
            const response = await medicalSearchService.searchConditions(query, 10);
            return response.suggestions.map(convertToSearchResult);
        } catch (error) {
            console.log('Condition search failed, using fallback:', error);
            // Fallback to popular suggestions
            const suggestions = await medicalSearchService.getSearchSuggestions(SearchCategory.CONDITIONS, query);
            return suggestions.map(convertToSearchResult);
        }
    };

    const performSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);

        try {
            const results = searchType === 'medicine'
                ? await searchMedicines(query)
                : await searchConditions(query);

            setSearchResults(results);
            setShowDropdown(results.length > 0);

            if (results.length > 0) {
                Animated.spring(dropdownAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }).start();
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleTextChange = (text: string) => {
        onChangeText(text);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(text);
        }, 300);
    };

    const handleSelectResult = (result: SearchResult) => {
        onChangeText(result.name);
        setShowDropdown(false);
        onSelectResult?.(result);
        Keyboard.dismiss();

        Animated.spring(dropdownAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const clearSearch = () => {
        onChangeText('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const renderSearchResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            onPress={() => handleSelectResult(item)}
            className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
            activeOpacity={0.7}
        >
            <Text className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                {item.name}
            </Text>
            {item.description && (
                <Text className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {item.description}
                </Text>
            )}
            {item.category && (
                <Text className={`text-xs mt-1 px-2 py-1 rounded-full self-start ${
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                }`}>
                    {item.category}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="relative">
            {/* Search Input */}
            <View className={`flex-row items-center px-4 py-3 rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
            } ${disabled ? 'opacity-50' : ''}`}>
                <Search size={20} color={isDark ? '#94A3B8' : '#6B7280'} />

                <TextInput
                    value={value}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                    className={`flex-1 ml-3 text-base ${isDark ? 'text-slate-100' : 'text-gray-800'}`}
                    textAlign={isRTL ? 'right' : 'left'}
                    editable={!disabled}
                    autoCapitalize="words"
                    autoCorrect={false}
                />

                {isSearching && (
                    <ActivityIndicator size="small" color={isDark ? '#94A3B8' : '#6B7280'} />
                )}

                {value.length > 0 && !isSearching && (
                    <TouchableOpacity onPress={clearSearch} className="p-1">
                        <X size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown Results */}
            {showDropdown && (
                <Animated.View
                    style={{
                        transform: [
                            {
                                translateY: dropdownAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-10, 0],
                                }),
                            },
                            {
                                scale: dropdownAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.95, 1],
                                }),
                            },
                        ],
                        opacity: dropdownAnimation,
                    }}
                    className={`absolute top-14 left-0 right-0 ${
                        isDark ? 'bg-slate-800' : 'bg-white'
                    } rounded-xl shadow-lg border ${
                        isDark ? 'border-slate-700' : 'border-gray-200'
                    } z-50 max-h-60`}
                >
                    <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                </Animated.View>
            )}
        </View>
    );
};

export default SearchDropdown;