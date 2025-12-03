import axios from 'axios';
import { BASE_URL, DEV_URL } from '../constants';
import { useDevStore } from '../stores';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const handleAPICall = async (
  method,
  endpoint,
  params,
  body,
  successCallback,
  finallyCallback = () => {},
  errorCallback = (error) => {},
  allowToast = true
) => {
  try {
    const { useDevBackend, devPrNumber } = useDevStore.getState();
    let currentBaseUrl = BASE_URL;

    if (useDevBackend) {
      if (devPrNumber) {
        currentBaseUrl = `https://aashray-backend-pr-${devPrNumber}.onrender.com/api/v1`;
      } else {
        currentBaseUrl = DEV_URL;
      }
    }

    if (!currentBaseUrl) {
      console.error('Base URL is undefined. Check your .env file and constants.');
      throw new Error('Network configuration error: Base URL is missing.');
    }

    const url = `${currentBaseUrl}${endpoint}`;

    let data = body;
    const headers = {};

    if (body?.image) {
      const formData = new FormData();
      formData.append('image', {
        uri: body.image,
        name: 'pfp.jpg',
        type: 'image/jpeg',
      });

      data = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    console.log('------------');
    console.log('URL: ', url);
    console.log('PARAMS: ', JSON.stringify(params));
    console.log('BODY: ', JSON.stringify(body));
    console.log('------------');

    const res = await axios({
      method,
      url,
      params,
      data,
      headers,
      // timeout: 10000,
      validateStatus: () => true,
    });

    if (res.status === 200 || res.status === 201) {
      successCallback(res.data);
    } else {
      console.log('ERROR: ', JSON.stringify(res.data));
      throw new Error(res.data.message || 'An error occurred');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const errorDetails = {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };

    if (errorCallback) errorCallback(errorDetails);

    console.log('ERROR: ', errorMessage);

    if (allowToast) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: errorMessage,
        swipeable: false,
        text1Style: { color: 'red' },
        text2Style: { color: 'black', fontWeight: 'bold', fontSize: 14 },
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } finally {
    if (finallyCallback) finallyCallback();
  }
};

export default handleAPICall;
