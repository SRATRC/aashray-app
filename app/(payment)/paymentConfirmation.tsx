import { View, Text, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import CustomButton from '../../components/CustomButton';
import moment from 'moment';

const paymentConfirmation = () => {
  const router = useRouter();
  // const [isLoading, setIsLoading] = useState(true);

  const DottedLine = () => (
    <View className={`my-4 w-full border border-dotted border-gray-300`}></View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-full justify-center">
        <ImageBackground
          source={images.ticketbg}
          resizeMode="contain"
          className="items-center justify-center">
          <View className="h-[70%] w-[70%] items-center justify-center">
            <Text className="text-center font-pmedium text-2xl">Payment Successful</Text>

            <DottedLine />

            <View className="flex w-full flex-col gap-y-2">
              <View className="flex flex-row justify-between">
                <Text className="font-pregular text-sm text-gray-400">Reference Number</Text>
                <Text className="font-pregular text-sm text-black">000085752257</Text>
              </View>

              <View className="flex flex-row justify-between">
                <Text className="font-pregular text-sm text-gray-400">Date</Text>
                <Text className="font-pregular text-sm text-black">
                  {moment().format('Do MMMM YYYY')}
                </Text>
              </View>

              <View className="flex flex-row justify-between">
                <Text className="font-pregular text-sm text-gray-400">Time</Text>
                <Text className="font-pregular text-sm text-black">
                  {moment().format('h:mm A')}
                </Text>
              </View>

              {/* <View className="flex flex-row justify-between">
                <Text className="font-pregular text-sm text-gray-400">Payment Method</Text>
                <Text className="font-pregular text-sm text-black">Credit Card</Text>
              </View> */}
            </View>

            <DottedLine />

            <View className="flex w-full flex-row justify-between">
              <Text className="font-pregular text-sm text-gray-400">Amount</Text>
              <Text className="font-pregular text-sm text-black">INR 1,000</Text>
            </View>

            <DottedLine />

            {/* <View className="flex flex-col w-full gap-y-2">
              <Text className="text-gray-400 font-pregular text-sm">
                Join the following WhatsApp groups by clicking on the links
                bellow to proceed
              </Text>
              <View className="flex flex-row gap-x-2 items-center">
                <Image
                  source={
                    isLoading ? icons.grayTickCircle : icons.orangeTickCircle
                  }
                  className="w-4 h-4"
                />
                <TouchableOpacity
                  onPress={() => {
                    openApp('https://chat.whatsapp.com/G3p8p3v0v8g');
                    setIsLoading(false);
                  }}
                >
                  <Text className="font-pregular text-sm text-blue-500 underline">
                    join whatsapp group
                  </Text>
                </TouchableOpacity>
              </View>
            </View> */}
          </View>
        </ImageBackground>

        <CustomButton
          containerStyles="min-h-[62px] mx-7"
          text={'Back to Home'}
          handlePress={() => router.replace('/home')}
        />
      </View>
    </SafeAreaView>
  );
};

export default paymentConfirmation;
