import { BASE_URL } from '../constants';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const handleAPICall = async (
  method,
  endpoint,
  params,
  body,
  successCallback,
  finallyCallback
) => {
  try {
    const url = `${BASE_URL}${endpoint}`;

    console.log('------------');
    console.log('URL: ', url);
    console.log('PARAMS: ', JSON.stringify(params));
    console.log('BODY: ', JSON.stringify(body));
    console.log('------------');

    const res = await axios({
      method: method,
      url: url,
      params: params,
      data: body,
      timeout: 10000,
      validateStatus: () => true
    });

    if (res.status === 200 || res.status === 201) {
      successCallback(res.data);
    } else {
      console.log('ERROR: ', JSON.stringify(res.data));
      throw new Error(res.data.message || 'An error occurred');
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An error occurred';

    console.log('ERROR: ', errorMessage);

    Toast.show({
      type: 'error',
      text1: 'An error occurred!',
      text2: errorMessage,
      text1Style: { color: 'red' },
      text2Style: { color: 'black', fontWeight: 'bold', fontSize: 14 }
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } finally {
    if (finallyCallback) finallyCallback();
  }
};

export default handleAPICall;
