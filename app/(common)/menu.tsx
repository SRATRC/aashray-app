import { Text, View, ActivityIndicator } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons } from '../../constants/index';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import handleAPICall from '../../utils/HandleApiCall';
import PageHeader from '../../components/PageHeader';
import moment from 'moment';
import CustomEmptyMessage from '~/components/CustomEmptyMessage';

const getFirstAndLastDate = (menuData: any) => {
  if (!menuData || Object.keys(menuData).length === 0) {
    return { firstDate: null, lastDate: null };
  }

  const dateKeys = Object.keys(menuData).sort((a, b) => moment(a).diff(moment(b)));

  return {
    firstDate: dateKeys[0],
    lastDate: dateKeys[dateKeys.length - 1],
  };
};

const Menu = () => {
  const { user } = useGlobalContext();

  const fetchMenu = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/food/menu',
        { cardno: user.cardno },
        null,
        (res: any) => {
          resolve(res.data);
        },
        () => {}
      );
    });
  };

  const {
    isLoading,
    isError,
    error,
    data: menuData,
  } = useQuery({
    queryKey: ['menu', user.cardno],
    queryFn: fetchMenu,
    staleTime: 1000 * 60 * 60 * 24 * 3,
    retry: false,
  });

  const renderItem = (reservation: any) => (
    <View className="my-1 mr-3 rounded-2xl bg-white p-4">
      <Text className="font-psemibold text-lg text-black">{reservation.meal}</Text>
      <Text className="font-pregular text-base text-gray-500">{reservation.name}</Text>
      <Text className="mt-2 font-plight text-sm text-gray-400">{reservation.time}</Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 items-center justify-center">
          <Text>{error.message || 'Error loading menu data'}</Text>
        </View>
      );
    }

    if (!menuData || Object.keys(menuData).length === 0) {
      return <CustomEmptyMessage message={'No menu data available'} />;
    }

    const { firstDate, lastDate } = getFirstAndLastDate(menuData);

    return (
      <Agenda
        items={menuData}
        selected={moment(firstDate).format('YYYY-MM-DD')}
        minDate={moment(firstDate).format('YYYY-MM-DD')}
        maxDate={moment(lastDate).format('YYYY-MM-DD')}
        pastScrollRange={1}
        futureScrollRange={1}
        renderItem={renderItem}
        hideKnob={true}
        theme={{
          selectedDayBackgroundColor: colors.orange,
          agendaTodayColor: colors.orange,
          dotColor: 'transparent',
          selectedDotColor: 'transparent',
          todayTextColor: colors.orange,
          textDayFontFamily: 'Poppins-Light',
        }}
      />
    );
  };

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <PageHeader title={'Menu'} icon={icons.backArrow} />
      {renderContent()}
    </SafeAreaView>
  );
};

export default Menu;
