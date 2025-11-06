import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  KeyboardProvider,
  KeyboardAvoidingView,
  KeyboardController,
  useKeyboardAnimation,
  useKeyboardController,
} from 'react-native-keyboard-controller';
import { colors } from '../constants';
import { Ionicons, AntDesign } from '@expo/vector-icons';
// @ts-ignore
import { debounce } from 'lodash';

// Define types
interface Option {
  key: any;
  value: any;
  iconName?: string;
}

interface SearchInputComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  inputRef: React.RefObject<TextInput | null>;
}

interface CustomSelectBottomSheetProps {
  options: Option[] | null | undefined;
  selectedValue?: string | number | null;
  selectedValues?: Array<string | number>;
  onValueChange?: (value: string | number) => void;
  onValuesChange?: (values: Array<string | number>) => void;
  placeholder?: string;
  label?: string;
  multiSelect?: boolean;
  confirmButtonText?: string;
  maxSelectedDisplay?: number;
  style?: any;
  className?: string;
  saveKeyInsteadOfValue?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  onRetry?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
}

// Optimized item component with improved memo implementation
const SelectItem = memo(
  ({
    item,
    isSelected,
    onSelect,
    multiSelect,
  }: {
    item: Option;
    isSelected: boolean;
    onSelect: () => void;
    multiSelect: boolean;
  }) => {
    return (
      <TouchableOpacity
        className="mb-1 flex-row items-center justify-between border-b border-gray-100 px-4 py-4"
        onPress={onSelect}
        activeOpacity={0.7}
        style={{
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomColor: '#fdf6e6',
          borderRadius: 12,
          ...(isSelected && {
            backgroundColor: '#fdf6e6',
          }),
        }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            color: isSelected ? colors.orange : colors.gray_400,
            fontWeight: isSelected ? '500' : '400',
          }}>
          {item.value}
        </Text>

        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#FDF6E6',
              borderWidth: 1,
              borderColor: colors.orange,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <AntDesign name="check" size={16} color={colors.orange} />
          </View>
        )}

        {multiSelect && !isSelected && (
          <View
            style={{
              height: 24,
              width: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.gray_400,
              backgroundColor: 'white',
            }}
          />
        )}
      </TouchableOpacity>
    );
  },
  // Explicit comparison function to ensure we correctly handle selection state changes
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.multiSelect === nextProps.multiSelect &&
      prevProps.item.key === nextProps.item.key
    );
  }
);

// Memoized search input component to prevent re-renders
const SearchInputComponent = memo<SearchInputComponentProps>(
  ({ value, onChangeText, placeholder, placeholderTextColor, inputRef }) => {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'ios' ? 8 : 0,
        }}>
        <Ionicons name="search" size={20} color={colors.gray_400} style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={{
            flex: 1,
            fontFamily: 'Poppins-Regular',
            fontSize: 16,
            color: colors.black_100,
            paddingVertical: Platform.OS === 'android' ? 8 : 0,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <AntDesign name="close" size={20} color={colors.gray_400} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

const { height } = Dimensions.get('window');

const CustomSelectBottomSheet: React.FC<CustomSelectBottomSheetProps> = ({
  options,
  selectedValue,
  selectedValues = [],
  onValueChange,
  onValuesChange,
  placeholder = 'Select an option',
  label,
  multiSelect = false,
  confirmButtonText = 'Confirm',
  maxSelectedDisplay = 2,
  style,
  className = '',
  saveKeyInsteadOfValue = true,
  isLoading = false,
  loadingText = 'Loading options...',
  onRetry,
  searchable = false,
  searchPlaceholder = 'Search...',
  noResultsText = 'No matching options found',
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [tempSelectedValues, setTempSelectedValues] = useState<Array<string | number>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchInputRef = useRef<TextInput | null>(null);
  const flashListRef = useRef(null);

  // Use keyboard controller hooks
  const { setEnabled } = useKeyboardController();
  const { height: keyboardHeight, progress } = useKeyboardAnimation();

  // Track keyboard visibility
  useEffect(() => {
    const unsubscribe = progress.addListener(({ value }) => {
      setIsKeyboardVisible(value > 0);
    });
    return () => {
      progress.removeListener(unsubscribe);
    };
  }, [progress]);

  // Update filtered options when options change
  useEffect(() => {
    if (options) {
      setFilteredOptions(options);
    }
  }, [options]);

  // Use debounce for search to avoid performance issues with large lists
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!options) return;

      setIsSearching(true);
      if (!query.trim()) {
        setFilteredOptions(options);
      } else {
        const lowerQuery = query.toLowerCase().trim();
        const filtered = options.filter((opt) =>
          opt.value.toString().toLowerCase().includes(lowerQuery)
        );
        setFilteredOptions(filtered);
      }
      setIsSearching(false);
    }, 300),
    [options]
  );

  // Filter options based on search query
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Stable callback reference to prevent re-renders
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const isValueSelected = useCallback((value: string | number | null | undefined): boolean => {
    // Check if not null and not undefined
    if (value === null || value === undefined) return false;
    // Also exclude empty strings
    if (typeof value === 'string' && value.trim() === '') return false;
    // All other values are valid (including 0)
    return true;
  }, []);

  const hasInvalidSelection = useCallback((): boolean => {
    if (!options || options.length === 0 || isLoading) return false;

    if (multiSelect) {
      // Check if any selected value doesn't exist in options
      return selectedValues.some(
        (val) => !options.find((o) => (saveKeyInsteadOfValue ? o.key === val : o.value === val))
      );
    } else {
      // Check if selectedValue exists but doesn't match any option
      if (!isValueSelected(selectedValue)) return false;
      return !options.find((o) =>
        saveKeyInsteadOfValue ? o.key === selectedValue : o.value === selectedValue
      );
    }
  }, [
    options,
    isLoading,
    multiSelect,
    selectedValues,
    selectedValue,
    saveKeyInsteadOfValue,
    isValueSelected,
  ]);

  const getDisplayText = useCallback((): string => {
    if (isLoading) return loadingText;
    if (!options || options.length === 0) return 'No options available';

    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder;

      const validValues = selectedValues.filter((val) =>
        options.find((o) => (saveKeyInsteadOfValue ? o.key === val : o.value === val))
      );

      if (validValues.length === 0) {
        return 'Invalid selection - tap to update';
      }

      if (validValues.length === 1) {
        const option = options.find((opt) =>
          saveKeyInsteadOfValue ? opt.key === validValues[0] : opt.value === validValues[0]
        );
        return option ? option.value : placeholder;
      }

      if (validValues.length > maxSelectedDisplay) {
        return `${validValues.length} items selected`;
      }

      return validValues
        .map((val) => {
          const opt = options.find((o) =>
            saveKeyInsteadOfValue ? o.key === val : o.value === val
          );
          return opt ? opt.value : '';
        })
        .filter((v) => v !== '')
        .join(', ');
    } else {
      if (isValueSelected(selectedValue)) {
        const selectedOption = options.find((o) =>
          saveKeyInsteadOfValue ? o.key === selectedValue : o.value === selectedValue
        );
        if (!selectedOption) {
          return 'Invalid selection - tap to update';
        }
        return selectedOption.value;
      }
      return placeholder;
    }
  }, [
    isLoading,
    loadingText,
    options,
    multiSelect,
    selectedValues,
    placeholder,
    maxSelectedDisplay,
    saveKeyInsteadOfValue,
    selectedValue,
    isValueSelected,
  ]);

  const openBottomSheet = useCallback(() => {
    if ((options && options.length > 0) || isLoading) {
      setSearchQuery('');
      setFilteredOptions(options || []);

      setEnabled(false);

      setModalVisible(true);
      if (multiSelect) setTempSelectedValues([...selectedValues]);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [options, isLoading, multiSelect, selectedValues, slideAnim, setEnabled]);

  const closeBottomSheet = useCallback(() => {
    // Use keyboard controller's static dismiss method
    KeyboardController.dismiss();
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setEnabled(true);
    });
  }, [slideAnim, height, setEnabled]);

  // Improved handleSelect to ensure instant visual feedback
  const handleSelect = useCallback(
    (item: Option) => {
      const value = saveKeyInsteadOfValue ? item.key : item.value;
      if (multiSelect) {
        // Use functional update pattern for best performance
        setTempSelectedValues((prev) =>
          prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
      } else {
        // Update the selected value immediately
        onValueChange?.(value);
        // Add a small delay before closing to show the tick mark
        setTimeout(() => {
          closeBottomSheet();
        }, 150); // 150ms is enough to see the tick without feeling slow
      }
    },
    [multiSelect, saveKeyInsteadOfValue, onValueChange, closeBottomSheet]
  );

  const confirmMultiSelection = useCallback(() => {
    onValuesChange?.(tempSelectedValues);
    closeBottomSheet();
  }, [tempSelectedValues, onValuesChange, closeBottomSheet]);

  // Optimized isSelected function
  const isSelected = useCallback(
    (item: Option): boolean => {
      const value = saveKeyInsteadOfValue ? item.key : item.value;
      return multiSelect ? tempSelectedValues.includes(value) : value === selectedValue;
    },
    [multiSelect, tempSelectedValues, saveKeyInsteadOfValue, selectedValue]
  );

  // Optimized renderItem function with proper dependencies
  const renderItem = useCallback(
    ({ item }: { item: Option }) => {
      return (
        <SelectItem
          item={item}
          isSelected={isSelected(item)}
          onSelect={() => handleSelect(item)}
          multiSelect={multiSelect}
        />
      );
    },
    [isSelected, handleSelect, multiSelect, tempSelectedValues, selectedValue] // Include selection state dependencies
  );

  // For multi-select, we need a selected chips display component
  const SelectedChips = useMemo(() => {
    if (!multiSelect || tempSelectedValues.length === 0 || !options) return null;

    return (
      <View className="border-t border-gray-200 px-4 py-3">
        <Text
          style={{
            marginBottom: 8,
            fontFamily: 'Poppins-Medium',
            fontSize: 14,
            color: colors.gray_400,
          }}>
          Selected ({tempSelectedValues.length}):
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
          {tempSelectedValues.map((value) => {
            const option = options.find((opt) =>
              saveKeyInsteadOfValue ? opt.key === value : opt.value === value
            );
            if (!option) return null;

            return (
              <View
                key={value.toString()}
                className="mr-2 flex-row items-center rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: '#fdf6e6',
                  borderColor: colors.orange,
                  borderWidth: 1,
                }}>
                <Text
                  style={{
                    marginRight: 4,
                    fontFamily: 'Poppins-Medium',
                    fontSize: 14,
                    color: colors.orange,
                  }}>
                  {option.value}
                </Text>
                <TouchableOpacity
                  onPress={() => setTempSelectedValues((prev) => prev.filter((v) => v !== value))}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <AntDesign name="close" size={14} color={colors.orange} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [multiSelect, tempSelectedValues, options, saveKeyInsteadOfValue]);

  // Content to display when loading or when there are no options
  const EmptyContent = useMemo(() => {
    if (isLoading || isSearching) {
      return (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colors.orange} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: 'Poppins-Medium',
              fontSize: 16,
              color: colors.gray_400,
              textAlign: 'center',
            }}>
            {isSearching ? 'Searching...' : loadingText}
          </Text>
        </View>
      );
    }

    if (!options || options.length === 0) {
      return (
        <View className="items-center justify-center py-8">
          <AntDesign name="exclamation-circle" size={32} color={colors.gray_400} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: 'Poppins-Medium',
              fontSize: 16,
              color: colors.gray_400,
              textAlign: 'center',
            }}>
            No options available
          </Text>
          {onRetry && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.orange,
                borderRadius: 8,
              }}
              onPress={onRetry}>
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  fontSize: 14,
                  color: 'white',
                }}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Show no results message when search has no matches
    if (searchable && searchQuery && filteredOptions.length === 0) {
      return (
        <View className="items-center justify-center py-8">
          <Ionicons name="search" size={32} color={colors.gray_400} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: 'Poppins-Medium',
              fontSize: 16,
              color: colors.gray_400,
              textAlign: 'center',
            }}>
            {noResultsText}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: colors.orange,
              borderRadius: 8,
            }}
            onPress={() => setSearchQuery('')}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 14,
                color: 'white',
              }}>
              Clear Search
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }, [
    isLoading,
    isSearching,
    options,
    loadingText,
    onRetry,
    searchable,
    searchQuery,
    filteredOptions,
    noResultsText,
  ]);

  // Use keyExtractor for optimized list rendering
  const keyExtractor = useCallback((item: Option) => item.key.toString(), []);

  return (
    <View className={`w-full ${className}`} style={style}>
      {label && <Text className="font-pmedium text-base text-gray-600">{label}</Text>}

      <TouchableOpacity
        className="flex-row items-center justify-between rounded-xl bg-gray-100 p-4"
        onPress={openBottomSheet}
        activeOpacity={0.7}
        disabled={!isLoading && (!options || options.length === 0)}
        style={{
          minHeight: 60,
          borderWidth: hasInvalidSelection() ? 1 : 0,
          borderColor: hasInvalidSelection() ? '#EF4444' : 'transparent',
          opacity: !isLoading && (!options || options.length === 0) ? 0.6 : 1,
        }}>
        <View className="mr-2 flex-1 flex-row items-center">
          {hasInvalidSelection() && (
            <AntDesign
              name="exclamation-circle"
              size={16}
              color="#EF4444"
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            className={`flex-1 font-pmedium text-base`}
            style={{
              color: hasInvalidSelection()
                ? '#EF4444'
                : isLoading ||
                    (multiSelect ? selectedValues.length === 0 : !isValueSelected(selectedValue))
                  ? colors.gray_400
                  : colors.black_100,
            }}
            numberOfLines={1}>
            {getDisplayText()}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.gray_400} />
        ) : (
          <AntDesign
            name="down"
            size={16}
            color={hasInvalidSelection() ? '#EF4444' : colors.gray_400}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={closeBottomSheet}>
        <KeyboardProvider>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
            <View className="flex-1 justify-end bg-black/50">
              <Pressable
                onPress={closeBottomSheet}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <Animated.View
                className="overflow-hidden rounded-t-3xl bg-white"
                style={[
                  {
                    transform: [{ translateY: slideAnim }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    elevation: 10,
                  },
                  // Apply keyboard offset as a separate style
                  isKeyboardVisible && {
                    marginBottom: 20, // Static margin when keyboard is visible
                  },
                ]}>
                {/* Pull indicator */}
                <View className="items-center pb-3 pt-2">
                  <View className="h-1.5 w-16 rounded-full bg-gray-300" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between border-b border-gray-200 px-4 pb-4">
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-SemiBold',
                      color: colors.black_100,
                    }}>
                    {label || (multiSelect ? 'Select options' : 'Select an option')}
                  </Text>
                  <TouchableOpacity
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                    onPress={closeBottomSheet}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <AntDesign name="close" size={18} color={colors.gray_400} />
                  </TouchableOpacity>
                </View>

                {/* Selected chips for multi-select */}
                {SelectedChips}

                {/* Search bar */}
                {searchable && (
                  <View className="border-t border-gray-200 px-4 py-3">
                    <SearchInputComponent
                      inputRef={searchInputRef}
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      placeholder={searchPlaceholder}
                      placeholderTextColor={colors.gray_400}
                    />
                  </View>
                )}

                {/* Loading indicator or empty state */}
                {EmptyContent}

                {/* Options list - Only show if we have options and are not loading */}
                {!isLoading &&
                  !isSearching &&
                  options &&
                  options.length > 0 &&
                  filteredOptions.length > 0 && (
                    <View
                      style={{
                        height: isKeyboardVisible
                          ? Math.min(height * 0.25, filteredOptions.length * 60)
                          : Math.min(height * 0.4, filteredOptions.length * 60),
                      }}>
                      <FlashList
                        ref={flashListRef}
                        data={filteredOptions}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                          paddingHorizontal: 8,
                          paddingVertical: 8,
                        }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        initialScrollIndex={0}
                        onEndReachedThreshold={0.5}
                        removeClippedSubviews={true}
                        extraData={[tempSelectedValues, selectedValue]} // Add this to ensure list updates when selection changes
                      />
                    </View>
                  )}

                {/* Confirm button for multi-select - Only show if not loading and have options */}
                {multiSelect && !isLoading && options && options.length > 0 && (
                  <View className="border-t border-gray-200 px-4 py-3">
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.orange,
                        borderRadius: 12,
                        padding: 12,
                        alignItems: 'center',
                      }}
                      onPress={confirmMultiSelection}
                      activeOpacity={0.8}>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Medium',
                          fontSize: 16,
                          color: 'white',
                        }}>
                        {confirmButtonText} ({tempSelectedValues.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Safe area padding at bottom */}
                <View className="h-8" />
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </KeyboardProvider>
      </Modal>
    </View>
  );
};

export default CustomSelectBottomSheet;
