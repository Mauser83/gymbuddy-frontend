import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import Button from 'shared/components/Button';
import {Portal} from 'react-native-portalize';

export type NamedFilterOptions = {
  label: string;
  options: FilterOptions;
};
export type FilterOptions = string[] | Record<string, string[]>;
export interface FilterPanelProps {
  options: Record<string, {label: string; options: FilterOptions}>;
  onChangeFilters?: (filters: Record<string, string[]>) => void;
}

// Determine direction for submenu/chevron based on index and category count
const getDirectionForIndex = (i: number, count: number): 'left' | 'right' => {
  if (count <= 2) return i === 0 ? 'right' : 'left';
  if (count === 3 || count === 4) return i < 2 ? 'right' : 'left';
  return i < count / 2 ? 'right' : 'left';
};

function DirectionChevron({
  direction,
  expanded,
}: {
  direction: 'left' | 'right';
  expanded: boolean;
}) {
  const {theme} = useTheme();
  return (
    <Text
      style={{color: theme.colors.accentStart, width: 20, textAlign: 'center'}}>
      {direction === 'right'
        ? expanded
          ? '◀'
          : '▶'
        : expanded
          ? '▶'
          : '◀'}
    </Text>
  );
}

export default function FilterPanel({
  options,
  onChangeFilters,
}: FilterPanelProps) {
  const {theme} = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const categories = Object.keys(options);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >(Object.fromEntries(categories.map(c => [c, []])));

  const labelRefs = useRef<Record<string, View | null>>(
    Object.fromEntries(categories.map(c => [c, null])),
  );
  const parentRefs = useRef<Record<string, View | null>>({});
  const [parentDirections, setParentDirections] = useState<
    Record<string, 'left' | 'right'>
  >({});

  const [dropdownPos, setDropdownPos] = useState({x: 0, y: 0, width: 150});
  const [subDropdownPos, setSubDropdownPos] = useState({
    x: 0,
    y: 0,
    width: 150,
  });
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const submenuAnim = useRef(new Animated.Value(0)).current;

  const [openDirection, setOpenDirection] = useState<'left' | 'right'>('right');

  const openDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(submenuAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setActiveParent(null);
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setActiveCategory(null);
      });
    });
  };

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(value);
      const updated = isSelected
        ? current.filter(v => v !== value)
        : [...current, value];
      return {...prev, [category]: updated};
    });
  };

  const clearFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const updated = prev[category].filter(v => v !== value);
      return {...prev, [category]: updated};
    });
  };

  const isNested = (opt: FilterOptions): opt is Record<string, string[]> =>
    typeof opt === 'object' && !Array.isArray(opt);

  useEffect(() => {
    onChangeFilters?.(selectedFilters);
  }, [selectedFilters]);

  return (
    <View style={{gap: spacing.md}}>
      {/* Category Header */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          borderWidth: 2,
          borderColor: theme.colors.accentStart,
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        }}>
        {categories.map((cat, index) => {
          const direction = getDirectionForIndex(index, categories.length);
          return (
            <View
              key={cat}
              ref={ref => {
                labelRefs.current[cat] = ref;
              }}
              style={{
                flexBasis: `${100 / categories.length}%`,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.sm,
                borderRightWidth: index !== categories.length - 1 ? 1 : 0,
                borderColor: '#ffffff',
              }}>
              <Pressable
                onPress={() => {
                  const ref = labelRefs.current[cat];
                  if (ref) {
                    ref.measure((fx, fy, width, height, px, py) => {
                      const dropdownWidth = 150;
                      const margin = 25;
                      let x = px + width / 2 - dropdownWidth / 2;
                      if (x < margin) x = margin;
                      if (x + dropdownWidth > screenWidth - margin)
                        x = screenWidth - margin - dropdownWidth;
                      setDropdownPos({x, y: py + height, width: dropdownWidth});
                      setOpenDirection(direction);
                      setActiveCategory(prev => (prev === cat ? null : cat));
                      setActiveParent(null);
                      openDropdown();
                    });
                  }
                }}
                style={{width: '100%', alignItems: 'center'}}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: theme.colors.textPrimary,
                  }}>
                  {options[cat].label}
                </Text>
                <Text style={{fontSize: 10, color: theme.colors.accentStart}}>
                  {activeCategory === cat ? '▲' : '▼'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Selected Filters */}
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
        {Object.entries(selectedFilters).flatMap(([key, values]) =>
          values.map(value => (
            <Pressable
              key={`${key}-${value}`}
              onPress={() => clearFilter(key, value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.sm,
                paddingVertical: 6,
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.accentStart,
                minHeight: 34,
              }}>
              <Text style={{color: theme.colors.textPrimary, marginRight: 4}}>
                {value}
              </Text>
              <Text
                style={{color: theme.colors.accentStart, fontWeight: 'bold'}}>
                X
              </Text>
            </Pressable>
          )),
        )}
      </View>

      {/* Dropdowns */}
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

            {/* Main Dropdown */}
            <Animated.View
              pointerEvents="auto"
              style={{
                position: 'absolute',
                top: dropdownPos.y + 4,
                left: openDirection === 'right' ? dropdownPos.x : undefined,
                right:
                  openDirection === 'left'
                    ? screenWidth - dropdownPos.x - dropdownPos.width
                    : undefined,
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
              {isNested(options[activeCategory].options) ? (
                <ScrollView
                  style={{maxHeight: 300}}
                  contentContainerStyle={{paddingBottom: spacing.sm}}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled>
                  {Object.keys(options[activeCategory].options).map(
                    (parent, index, arr) => {
                      const direction = getDirectionForIndex(
                        categories.indexOf(activeCategory),
                        categories.length,
                      );
                      const isLast = index === arr.length - 1;
                      return (
                        <Pressable
                          key={parent}
                          ref={ref => {
                            parentRefs.current[parent] = ref;
                          }}
                          onPress={() => {
                            if (activeParent === parent) {
                              setActiveParent(null);
                              return;
                            }
                            const ref = parentRefs.current[parent];
                            if (ref) {
                              ref.measure((fx, fy, width, height, px, py) => {
                                setSubDropdownPos({x: px, y: py, width});
                                setParentDirections(prev => ({
                                  ...prev,
                                  [parent]: direction,
                                }));
                                setActiveParent(parent);
                                Animated.timing(submenuAnim, {
                                  toValue: 1,
                                  duration: 200,
                                  useNativeDriver: Platform.OS !== 'web',
                                }).start();
                              });
                            }
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: spacing.md,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: theme.colors.textSecondary,
                          }}>
                          {direction === 'left' && (
                            <DirectionChevron
                              direction="left"
                              expanded={activeParent === parent}
                            />
                          )}
                          <Text
                            style={{
                              flex: 1,
                              color: theme.colors.textPrimary,
                              fontWeight:
                                activeParent === parent ? 'bold' : 'normal',
                            }}>
                            {parent}
                          </Text>
                          {direction === 'right' && (
                            <DirectionChevron
                              direction="right"
                              expanded={activeParent === parent}
                            />
                          )}
                        </Pressable>
                      );
                    },
                  )}
                </ScrollView>
              ) : (
                <ScrollView
                  style={{maxHeight: 300}}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled>
                  {(options[activeCategory].options as string[]).map(
                    (option, index) => {
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
                              index !==
                              (options[activeCategory].options as string[])
                                .length -
                                1
                                ? 1
                                : 0,
                            backgroundColor: theme.colors.surface,
                          }}>
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
                          <Text
                            style={{
                              color: theme.colors.textPrimary,
                              flex: 1,
                            }}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </ScrollView>
              )}
            </Animated.View>

            {/* Sub Dropdown */}
            {activeParent &&
              activeCategory &&
              isNested(options[activeCategory].options) && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: dropdownPos.y + 4,
                    left:
                      parentDirections[activeParent] === 'right'
                        ? subDropdownPos.x + subDropdownPos.width + 8
                        : subDropdownPos.x - dropdownPos.width - 8,
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
                    opacity: submenuAnim,
                    transform: [
                      {
                        translateY: submenuAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-5, 0],
                        }),
                      },
                    ],
                  }}>
                  {(
                    options[activeCategory].options as Record<string, string[]>
                  )[activeParent].map((option: string, index: number) => {
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
                            index !==
                            (
                              options[activeCategory].options as Record<
                                string,
                                string[]
                              >
                            )[activeParent].length -
                              1
                              ? 1
                              : 0,
                          backgroundColor: theme.colors.surface,
                        }}>
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
                        <Text
                          style={{color: theme.colors.textPrimary, flex: 1}}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}
          </>
        )}
      </Portal>

      <View>
        <Button
          text="Reset Choices"
          onPress={() => {
            const cleared = Object.fromEntries(categories.map(c => [c, []]));
            setSelectedFilters(cleared);
            setActiveCategory(null);
            setActiveParent(null);
          }}
        />
      </View>
    </View>
  );
}
