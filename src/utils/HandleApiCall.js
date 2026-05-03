import axios from 'axios';
import { BASE_URL, DEV_URL } from '../constants';
import { useDevStore } from '../stores';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';

const generateRequestId = () =>
  Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

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
  const requestId = generateRequestId();

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
    const headers = { 'x-request-id': requestId };

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

    if (__DEV__) {
      console.log('------------');
      console.log('URL: ', url);
      console.log('PARAMS: ', JSON.stringify(params));
      console.log('BODY: ', JSON.stringify(body));
      console.log('------------');
    }

    Sentry.addBreadcrumb({
      category: 'api.request',
      message: `${method.toUpperCase()} ${endpoint}`,
      data: { params, body, requestId },
      level: 'info',
    });

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
      const err = new Error(res.data.message || 'An error occurred');
      err.correlationId = res.headers['x-request-id'] || requestId;
      throw err;
    }
  } catch (error) {
    const correlationId = error.correlationId || error.response?.headers?.['x-request-id'] || requestId;
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const errorDetails = {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      correlationId,
      originalError: error,
    };

    if (errorCallback) errorCallback(errorDetails);

    if (__DEV__) console.log('ERROR: ', errorMessage);

    Sentry.addBreadcrumb({
      category: 'api.error',
      message: `${endpoint} failed: ${errorMessage}`,
      data: errorDetails,
      level: 'error',
    });

    Sentry.setTag('correlation_id', correlationId);

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
