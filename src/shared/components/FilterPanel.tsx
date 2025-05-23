import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import Button from 'shared/components/Button';
import {Portal} from 'react-native-portalize';

interface FilterPanelProps {
  onChangeFilters?: (filters: Record<string, string[]>) => void;
}

const FILTER_CATEGORIES = [
  {key: 'type', label: 'Type'},
  {key: 'difficulty', label: 'Difficulty'},
  {key: 'bodyPart', label: 'Body Part'},
  {key: 'muscle', label: 'Muscle'},
] as const;

type FilterCategory = (typeof FILTER_CATEGORIES)[number]['key'];
type FilterOptions = Record<FilterCategory, string[]>;

const mockOptions: FilterOptions = {
  type: ['Free Weights', 'Machines', 'Cables', 'Bands'],
  difficulty: ['Beginner', 'Intermediate', 'Advanced'],
  bodyPart: ['Chest', 'Back', 'Legs', 'Arms'],
  muscle: ['Biceps', 'Triceps', 'Lats', 'Quads', 'Hamstrings'],
};

export default function FilterPanel({onChangeFilters}: FilterPanelProps) {
  const {theme} = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(
    null,
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Record<FilterCategory, string[]>
  >({
    type: [],
    difficulty: [],
    bodyPart: [],
    muscle: [],
  });

  const labelRefs = useRef<Record<FilterCategory, View | null>>({
    type: null,
    difficulty: null,
    bodyPart: null,
    muscle: null,
  });

  const [dropdownPos, setDropdownPos] = useState({x: 0, y: 0, width: 150});
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const openDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setActiveCategory(null);
    });
  };

  const toggleFilter = (category: FilterCategory, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(value);
      const updated = isSelected
        ? current.filter(v => v !== value)
        : [...current, value];
      const next = {...prev, [category]: updated};
      onChangeFilters?.(next);
      return next;
    });
  };

  const clearFilter = (category: FilterCategory, value: string) => {
    setSelectedFilters(prev => {
      const updated = prev[category].filter(v => v !== value);
      const next = {...prev, [category]: updated};
      onChangeFilters?.(next);
      return next;
    });
  };

  return (
    <View style={{gap: spacing.md}}>
      {/* Filter Category Labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surface,
        }}>
        {FILTER_CATEGORIES.map(cat => {
          return (
            <View
              key={cat.key}
              ref={ref => {
                labelRefs.current[cat.key] = ref;
              }}
              style={{
                alignItems: 'center',
                borderLeftColor: theme.colors.textPrimary,
                borderLeftWidth: 1,
                borderRightColor: theme.colors.textPrimary,
                borderRightWidth: 1,
              }}>
              <Pressable
                onPress={() => {
                  const ref = labelRefs.current[cat.key];
                  if (ref) {
                    ref.measure((fx, fy, width, height, px, py) => {
                      const dropdownWidth = 150;
                      let x = px + width / 2 - dropdownWidth / 2;

                      const margin = 25;
                      if (x < margin) x = margin;
                      if (x + dropdownWidth > screenWidth - margin)
                        x = screenWidth - margin - dropdownWidth;

                      setDropdownPos({x, y: py + height, width: dropdownWidth});
                      setActiveCategory(prev =>
                        prev === cat.key ? null : cat.key,
                      );
                      openDropdown();
                    });
                  }
                }}
                style={{
                  paddingHorizontal: spacing.sm,
                  borderRadius: 8,
                }}>
                <Text
                  style={{fontWeight: 'bold', color: theme.colors.textPrimary}}>
                  {cat.label}
                </Text>
              </Pressable>
              <Text style={{fontSize: 10, color: theme.colors.accentStart}}>
                {activeCategory === cat.key ? '▲' : '▼'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Active Filter Tags */}
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
        {Object.entries(selectedFilters).flatMap(([key, values]) =>
          values.map(value => (
            <Pressable
              key={`${key}-${value}`}
              onPress={() => clearFilter(key as FilterCategory, value)}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
              }}>
              <Text style={{color: theme.colors.textPrimary}}>
                🏷 {value} ✖
              </Text>
            </Pressable>
          )),
        )}
      </View>

      {/* Dropdown Panel */}
      <Portal>
        {activeCategory && (
          <>
            <Pressable
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
              onPress={closeDropdown}
            />
            <Animated.View
              pointerEvents="auto"
              style={{
                position: 'absolute',
                top: dropdownPos.y + 4,
                left: dropdownPos.x,
                width: dropdownPos.width,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: spacing.sm,
                borderColor: theme.colors.accentStart,
                borderWidth: 1,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowOffset: {width: 0, height: 4},
                shadowRadius: 12,
                elevation: 5,
                opacity: dropdownAnim,
                transform: [
                  {
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              }}>
              {(mockOptions[activeCategory] || []).map((option, index) => {
                const isSelected =
                  selectedFilters[activeCategory]?.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleFilter(activeCategory, option)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: spacing.md,
                      paddingLeft: 5,
                      paddingRight: 5,
                      borderBottomColor: theme.colors.textSecondary,
                      borderBottomWidth:
                        index !== mockOptions[activeCategory].length - 1
                          ? 1
                          : 0,
                      backgroundColor: theme.colors.surface,
                    }}>
                    {/* Checkbox placeholder */}
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        marginRight: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: theme.colors.textPrimary,
                      }}>
                      {isSelected && (
                        <Text
                          style={{
                            color: theme.colors.accentStart,
                            fontSize: 16,
                          }}>
                          ✓
                        </Text>
                      )}
                    </View>

                    {/* Label text */}
                    <Text style={{color: theme.colors.textPrimary, flex: 1}}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          </>
        )}
      </Portal>

      {/* Reset Button */}
      <View style={{marginTop: spacing.lg}}>
        <Button
          text="Reset Filters"
          onPress={() => {
            const cleared = {
              type: [],
              difficulty: [],
              bodyPart: [],
              muscle: [],
            };
            setSelectedFilters(cleared);
            onChangeFilters?.(cleared);
            setActiveCategory(null);
          }}
        />
      </View>
    </View>
  );
}
