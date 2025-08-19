import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    Keyboard,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { medicalSearchService} from '../services/search/MedicalSearchService';
import {SearchCategory, SearchSuggestion} from "@/app/services/search/MedicalSearchTypes";
import {useTheme} from "@/app/context/ThemeContext";
import {useLanguage} from "@/app/context/LanguageContext";

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
    searchType: 'medicine' | 'condition' | 'allergy';
    onSelectResult?: (result: SearchResult) => void;
    disabled?: boolean;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
                                                           value,
                                                           onChangeText,
                                                           placeholder,
                                                           searchType,
                                                           onSelectResult,
                                                           disabled = false,
                                                       }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();

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

    const searchAllergies = async (query: string): Promise<SearchResult[]> => {
        try {
            const response = await medicalSearchService.searchAllergies(query, 10);
            return response.suggestions.map(convertToSearchResult);
        } catch (error) {
            console.log('Allergy search failed, using fallback:', error);
            // Fallback to popular suggestions
            const suggestions = await medicalSearchService.getSearchSuggestions(SearchCategory.ALLERGIES, query);
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
                : searchType === 'condition'
                    ? await searchConditions(query)
                    : await searchAllergies(query);

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

    return (
        <View className="relative">
            {/* Search Input */}
            <View
                style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: disabled ? 0.5 : 1
                }}
                className="flex-row items-center px-4 py-3 rounded-xl border"
            >
                <Search size={20} color={theme.textSecondary} />

                <TextInput
                    value={value}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    style={{ color: theme.text }}
                    className="flex-1 ml-3 text-base"
                    textAlign={isRTL ? 'right' : 'left'}
                    editable={!disabled}
                    autoCapitalize="words"
                    autoCorrect={false}
                />

                {isSearching && (
                    <ActivityIndicator size="small" color={theme.textSecondary} />
                )}

                {value.length > 0 && !isSearching && (
                    <TouchableOpacity onPress={clearSearch} className="p-1">
                        <X size={16} color={theme.textSecondary} />
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
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                    }}
                    className="absolute top-20  left-0 right-0 rounded-xl shadow-lg border z-50 max-h-96"
                >
                    <ScrollView
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        {searchResults.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleSelectResult(item)}
                                style={{ borderBottomColor: theme.border }}
                                className="p-4 border-b"
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: theme.text }} className="font-medium">
                                    {item.name}
                                </Text>
                                {item.description && (
                                    <Text style={{ color: theme.textSecondary }} className="text-sm mt-1">
                                        {item.description}
                                    </Text>
                                )}
                                {item.category && (
                                    <Text
                                        style={{
                                            backgroundColor: theme.surface,
                                            color: theme.textSecondary
                                        }}
                                        className="text-xs mt-1 px-2 py-1 rounded-full self-start"
                                    >
                                        {item.category}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
};

export default SearchDropdown;