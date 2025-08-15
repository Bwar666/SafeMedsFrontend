// HorizontalWeekCalendar.tsx
import React, { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    ListRenderItemInfo,
} from "react-native";
import dayjs, { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";
import { useTheme } from '../context/ThemeContext';
import {useLanguage} from "@/app/context/LanguageContext";

dayjs.extend(weekday);
dayjs.extend(isoWeek);

type HorizontalCalendarProps = {
    onDateSelected?: (date: Dayjs) => void;
};

export default function HorizontalCalendar({ onDateSelected }: HorizontalCalendarProps) {
    const { theme, isDark } = useTheme();
    const {t, isRTL} = useLanguage();
    const { width } = useWindowDimensions();
    const today = dayjs();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(today);

    // Calculate day width based on screen width
    const dayWidth = (width - 70) / 7; // 72 = 16 (padding) + 56 (margins: 14*4)

    // Generate weeks (5 months worth)
    const weeks: Dayjs[][] = useMemo(() => {
        const start = today.startOf("week");
        const end = today.add(5, "month").endOf("week");
        const weeks: Dayjs[][] = [];
        let current = start.clone();

        while (current.isBefore(end)) {
            const week: Dayjs[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(current.clone());
                current = current.add(1, "day");
            }
            weeks.push(week);
        }
        return weeks;
    }, [today]);

    const initialWeekIndex = useMemo(() => {
        return weeks.findIndex(week =>
            week.some(day => day.isSame(today, "day"))
        );
    }, [weeks, today]);

    // Handle date selection
    const selectDate = (date: Dayjs) => {
        setSelectedDate(date);
        onDateSelected?.(date);
    };

    // Render individual day
    const renderDay = (day: Dayjs, weekIndex: number, dayIndex: number) => {
        const isSelected = day.isSame(selectedDate, "day");
        const isToday = day.isSame(today, "day");
        const isFriday = day.day() === 5; // Friday (0=Sunday, 5=Friday)

        return (
            <Pressable
                key={`${weekIndex}-${dayIndex}`}
                onPress={() => selectDate(day)}
                style={[
                    styles.dayContainer,
                    {
                        width: dayWidth,
                        backgroundColor: isSelected
                            ? theme.primary
                            : isToday
                                ? isDark ? theme.surface : theme.primaryLight
                                : "transparent",
                    }
                ]}
            >
                <Text
                    style={[
                        styles.weekday,
                        {
                            color: isSelected
                                ? theme.card
                                : isFriday
                                    ? theme.error
                                    : theme.textSecondary
                        }
                    ]}
                >
                    {day.format("ddd").toUpperCase()}
                </Text>
                <Text
                    style={[
                        styles.dayNumber,
                        {
                            color: isSelected
                                ? theme.card
                                : isFriday
                                    ? theme.error
                                    : theme.text
                        }
                    ]}
                >
                    {day.format("D")}
                </Text>
            </Pressable>
        );
    };

    // Render week row
    const renderWeek = ({ item: week, index: weekIndex }: ListRenderItemInfo<Dayjs[]>) => (
        <View style={[styles.weekContainer, {
            // Force left-to-right for calendar scroll
            flexDirection: 'row',
            width: width - 28,
        }]}>
            {week.map((day, dayIndex) => renderDay(day, weekIndex, dayIndex))}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.calendarWrapper}>
                <FlatList
                    data={weeks}
                    keyExtractor={(week) => week[0].format("YYYY-MM-DD")}
                    renderItem={renderWeek}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(_, index) => ({
                        length: width - 32,
                        offset: (width - 32) * index,
                        index,
                    })}
                    initialScrollIndex={initialWeekIndex}
                    snapToInterval={width - 32}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    inverted={false}
                    contentContainerStyle={{ flexDirection: 'row' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 5,
    },
    calendarWrapper: {
        direction: 'ltr',
        writingDirection: 'ltr',
    },
    headerDate: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal:1,
    },
    dayContainer: {
        alignItems: "center",
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 12,
    },
    weekday: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: "500",
    },
});