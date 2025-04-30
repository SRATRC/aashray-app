import { View, Text, Image } from 'react-native';
import { icons, status } from '../../constants';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';

const TravelBookingDetails: React.FC<{ containerStyles?: any }> = ({ containerStyles }) => {
  const { data } = useGlobalContext();

  // Helper function to check if we're using the new journey structure
  const hasNewJourneyStructure = () => {
    return (
      data.travel?.toResearchCentre !== undefined || data.travel?.fromResearchCentre !== undefined
    );
  };

  // Helper function to check if we're using the outbound/return structure
  const hasOutboundReturnStructure = () => {
    return data.travel?.outbound !== undefined;
  };

  // Render the legacy travel format
  const renderLegacyTravel = () => (
    <View>
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.travelDetails?.status && (
            <CustomTag
              text={data.validationData?.travelDetails?.status}
              textStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'text-green-200'
                  : 'text-red-200'
              }
              containerStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }
            />
          )}
          <Text className="text-md font-pmedium">
            {moment(data.travel.date).format('Do MMMM, YYYY')}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
        <Text className="font-pregular text-gray-400">
          {data.travel.pickup === 'RC' ? 'Drop Point' : 'Pickup Point'}
        </Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
          {data.travel.pickup === 'RC' ? `${data.travel.drop}` : `${data.travel.pickup}`}
        </Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <FontAwesome5 name="suitcase" size={16} color="#BAB9C7" solid />
        <Text className="font-pregular text-gray-400">Luggage:</Text>
        <Text className="font-pmedium text-black">{data.travel.luggage}</Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <FontAwesome5 name="car" size={16} color="#BAB9C7" solid />
        <Text className="font-pregular text-gray-400">Booking Type:</Text>
        <Text className="font-pmedium text-black">{data.travel.type}</Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <FontAwesome5 name="comment-alt" size={16} color="#BAB9C7" solid />
        <Text className="font-pregular text-gray-400">Special Request:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
          {data.travel.special_request ? data.travel.special_request : 'None'}
        </Text>
      </View>
      {data.travel.charge && (
        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="dollar-sign" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {data.travel.charge}</Text>
        </View>
      )}
    </View>
  );

  // Render the To Research Centre journey
  const renderToResearchCentre = () => {
    const journey = data.travel.toResearchCentre;
    if (!journey || !journey.active) return null;

    return (
      <View>
        <View className="mb-2 mt-2 px-6">
          <Text className="font-psemibold text-lg text-secondary">To Research Centre</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="calendar-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Date:</Text>
          <Text className="font-pmedium text-black">
            {moment(journey.date).format('Do MMMM, YYYY')}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Pickup Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.pickup}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Drop Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.drop}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="suitcase" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Luggage:</Text>
          <Text className="font-pmedium text-black">{journey.luggage}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="car" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Booking Type:</Text>
          <Text className="font-pmedium text-black">{journey.type}</Text>
        </View>

        {journey.special_request && (
          <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
            <FontAwesome5 name="comment-alt" size={16} color="#BAB9C7" solid />
            <Text className="font-pregular text-gray-400">Special Request:</Text>
            <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
              {journey.special_request || 'None'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render the From Research Centre journey
  const renderFromResearchCentre = () => {
    const journey = data.travel.fromResearchCentre;
    if (!journey || !journey.active) return null;

    return (
      <View>
        <View className="mb-2 mt-2 px-6">
          <Text className="font-psemibold text-lg text-secondary">From Research Centre</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="calendar-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Date:</Text>
          <Text className="font-pmedium text-black">
            {moment(journey.date).format('Do MMMM, YYYY')}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Pickup Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.pickup}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Drop Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.drop}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="suitcase" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Luggage:</Text>
          <Text className="font-pmedium text-black">{journey.luggage}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="car" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Booking Type:</Text>
          <Text className="font-pmedium text-black">{journey.type}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="info-circle" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Leaving post adhyayan:</Text>
          <Text className="font-pmedium text-black">{journey.adhyayan}</Text>
        </View>

        {journey.special_request && (
          <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
            <FontAwesome5 name="comment-alt" size={16} color="#BAB9C7" solid />
            <Text className="font-pregular text-gray-400">Special Request:</Text>
            <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
              {journey.special_request || 'None'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render the Outbound journey from outbound/return structure
  const renderOutbound = () => {
    const journey = data.travel.outbound;
    if (!journey) return null;

    return (
      <View>
        <View className="mb-2 mt-2 px-6">
          <Text className="font-psemibold text-lg text-secondary">Outbound Journey</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="calendar-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Date:</Text>
          <Text className="font-pmedium text-black">
            {moment(journey.date).format('Do MMMM, YYYY')}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Pickup Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.pickup}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Drop Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.drop}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="suitcase" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Luggage:</Text>
          <Text className="font-pmedium text-black">{journey.luggage}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="car" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Booking Type:</Text>
          <Text className="font-pmedium text-black">{journey.type}</Text>
        </View>
      </View>
    );
  };

  // Render the Return journey from outbound/return structure
  const renderReturn = () => {
    const journey = data.travel.return;
    if (!data.travel.needsReturn || !journey) return null;

    return (
      <View>
        <View className="mb-2 mt-2 px-6">
          <Text className="font-psemibold text-lg text-secondary">Return Journey</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="calendar-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Date:</Text>
          <Text className="font-pmedium text-black">
            {moment(journey.date).format('Do MMMM, YYYY')}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Pickup Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.pickup}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="map-marker-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Drop Point:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {journey.drop}
          </Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="suitcase" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Luggage:</Text>
          <Text className="font-pmedium text-black">{journey.luggage}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="car" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Booking Type:</Text>
          <Text className="font-pmedium text-black">{journey.type}</Text>
        </View>
      </View>
    );
  };

  // Common information for outbound/return structure
  const renderCommonOutboundReturn = () => {
    if (!data.travel) return null;

    return (
      <View>
        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="info-circle" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Leaving post adhyayan:</Text>
          <Text className="font-pmedium text-black">{data.travel.adhyayan}</Text>
        </View>

        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="comment-alt" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Special Request:</Text>
          <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
            {data.travel.special_request || 'None'}
          </Text>
        </View>
      </View>
    );
  };

  // Header for all travel card variants
  const renderHeader = () => (
    <View>
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.travelDetails?.status && (
            <CustomTag
              text={data.validationData?.travelDetails?.status}
              textStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'text-green-200'
                  : 'text-red-200'
              }
              containerStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }
            />
          )}
          <Text className="text-md font-pmedium">Raj Pravas Booking</Text>
        </View>
      </View>
      <HorizontalSeparator otherStyles={'mb-4'} />
    </View>
  );

  // Main render logic
  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      {renderHeader()}

      {hasNewJourneyStructure() ? (
        <View>
          {renderToResearchCentre()}
          {data.travel.toResearchCentre?.active && data.travel.fromResearchCentre?.active && (
            <HorizontalSeparator otherStyles={'my-4'} />
          )}
          {renderFromResearchCentre()}
        </View>
      ) : hasOutboundReturnStructure() ? (
        <View>
          {renderOutbound()}
          {data.travel.needsReturn && <HorizontalSeparator otherStyles={'my-4'} />}
          {renderReturn()}
          {renderCommonOutboundReturn()}
        </View>
      ) : (
        renderLegacyTravel()
      )}

      {data.travel.charge && (
        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <FontAwesome5 name="dollar-sign" size={16} color="#BAB9C7" solid />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {data.travel.charge}</Text>
        </View>
      )}
    </PrimaryAddonBookingCard>
  );
};

export default TravelBookingDetails;
