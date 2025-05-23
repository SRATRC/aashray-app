import { Text, View, ActivityIndicator } from 'react-native';
import { Agenda, AgendaSchedule } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons, images } from '../../constants/index';
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
      return (
        <CustomEmptyMessage
          message="No menu data available for your visit"
          image={images.sadFace}
          imageClassName="h-[120px] w-[120px]"
          textClassName="text-base font-psemibold"
        />
      );
    }

    const { firstDate, lastDate } = getFirstAndLastDate(menuData);

    // Ensure we have a valid AgendaSchedule object
    const agendaItems: AgendaSchedule = menuData || { [moment().format('YYYY-MM-DD')]: [] };

    return (
      <Agenda
        items={agendaItems}
        selected={moment(firstDate || new Date()).format('YYYY-MM-DD')}
        minDate={moment(firstDate || new Date()).format('YYYY-MM-DD')}
        maxDate={moment(lastDate || new Date()).format('YYYY-MM-DD')}
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
      <PageHeader title={'Menu'} />
      {renderContent()}
    </SafeAreaView>
  );
};

export default Menu;
