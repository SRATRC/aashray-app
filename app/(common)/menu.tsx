import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from '@/context/GlobalProvider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import handleAPICall from '@/utils/HandleApiCall';
import PageHeader from '@/components/PageHeader';
import CustomEmptyMessage from '@/components/CustomEmptyMessage';

const { width } = Dimensions.get('window');

const MenuPage = () => {
  const { user } = useGlobalContext();
  const router = useRouter();

  const fetchMenu = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/food/menu',
        { cardno: user.cardno },
        null,
        (res) => {
          resolve(res.data);
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const {
    isLoading,
    isError,
    error,
    data: menuData,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['menu', user.cardno],
    queryFn: fetchMenu,
    staleTime: 1000 * 60 * 60 * 24 * 3,
    retry: false,
    enabled: !!user?.cardno,
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return { display: 'Today', isToday: true };
    if (isTomorrow) return { display: 'Tomorrow', isToday: false };

    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return { display: date.toLocaleDateString('en-US', options), isToday: false };
  };

  const getMealAccent = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '#F59E0B';
      case 'lunch':
        return '#10B981';
      case 'dinner':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Unable to load menu</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!menuData || Object.keys(menuData).length === 0) {
    return (
      <View style={styles.centerContainer}>
        <CustomEmptyMessage message="No menu available" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Menu" onPress={() => router.back()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000000" />
        }>
        {Object.entries(menuData).map(([date, meals]) => {
          const dateInfo = formatDate(date);

          return (
            <View key={date} style={styles.daySection}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <Text style={[styles.dateText, dateInfo.isToday && styles.todayText]}>
                  {dateInfo.display}
                </Text>
                {dateInfo.isToday && <View style={styles.todayIndicator} />}
              </View>

              {/* Meals */}
              {meals.map((meal, index) => {
                const accentColor = getMealAccent(meal.meal);

                return (
                  <View key={index} style={styles.mealCard}>
                    <View style={[styles.mealAccent, { backgroundColor: accentColor }]} />

                    <View style={styles.mealContent}>
                      <View style={styles.mealHeader}>
                        <Text style={styles.mealType}>{meal.meal}</Text>
                        <Text style={styles.mealTime}>{meal.time}</Text>
                      </View>

                      <Text style={styles.menuItems}>{meal.name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  daySection: {
    marginBottom: 40,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
  todayText: {
    color: '#000000',
  },
  todayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 12,
  },
  mealCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mealAccent: {
    width: 4,
  },
  mealContent: {
    flex: 1,
    padding: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'capitalize',
    letterSpacing: -0.3,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  menuItems: {
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MenuPage;
