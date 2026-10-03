import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';
import { resolveApiBaseUrl } from './resolveBaseUrl';

const generateRequestId = () =>
  Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// Fields that must never leave the device inside a Sentry breadcrumb or
// exception payload: login credentials, government/membership IDs, and
// personal profile data collected during onboarding.
const SENSITIVE_KEYS = new Set([
  'password',
  'otp',
  'token',
  'key',
  'secret',
  'auth',
  'authorization',
  'dob',
  'gender',
  'address',
  'pin',
  'pincode',
  'country',
  'aadhar',
  'aadhaar',
  'pan',
  'cardno',
  'idno',
  'mobno',
  'phone',
  'email',
  'razorpay_signature',
  'razorpay_payment_id',
  'razorpay_order_id',
]);

const scrubSensitiveData = (value) => {
  if (Array.isArray(value)) return value.map(scrubSensitiveData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? '[Redacted]' : scrubSensitiveData(val),
      ])
    );
  }
  return value;
};

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
    const currentBaseUrl = resolveApiBaseUrl();

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
      data: { params: scrubSensitiveData(params), body: scrubSensitiveData(body), requestId },
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
      err.status = res.status;
      err.responseData = res.data;
      throw err;
    }
  } catch (error) {
    const correlationId = error.correlationId || error.response?.headers?.['x-request-id'] || requestId;
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status ?? error.status;
    // validateStatus: () => true means axios never rejects on its own, so
    // error.response is never populated here — the response body travels
    // on error.responseData instead (attached where the error is thrown).
    const responseData = error.responseData ?? error.response?.data;
    const errorDetails = {
      message: errorMessage,
      status,
      data: responseData,
      correlationId,
      originalError: error,
    };

    if (errorCallback) errorCallback(errorDetails);

    if (__DEV__) console.log('ERROR: ', errorMessage);

    // Sentry gets a scrubbed copy — errorDetails.originalError carries the
    // raw Axios error (full request config, headers, body) for the local
    // errorCallback only, and must never itself be handed to Sentry.
    const { data, originalError, ...sentryContext } = errorDetails;
    sentryContext.endpoint = endpoint;
    sentryContext.responseData = scrubSensitiveData(data);

    Sentry.addBreadcrumb({
      category: 'api.error',
      message: `${endpoint} failed: ${errorMessage}`,
      data: sentryContext,
      level: 'error',
    });

    // No response (network/timeout) or a 5xx means the request never got a
    // real answer from the backend — that's a bug to see, not a normal
    // rejection. 4xx responses are the backend's validated business
    // decision (bad OTP, slot full, etc.) and are already surfaced to the
    // user via the toast below, so they don't need a Sentry issue too.
    // correlation_id is passed on this call's own tags rather than via
    // Sentry.setTag, which would mutate global scope and leak onto
    // unrelated later events until the next API error overwrites it.
    if (!status || status >= 500) {
      Sentry.captureException(error, {
        tags: { endpoint, correlation_id: correlationId },
        extra: sentryContext,
      });
    }

    if (allowToast) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: errorMessage,
        swipeable: false,
        text1Style: { color: 'red' },
        text2Style: { color: 'black', fontWeight: 'bold', fontSize: 14 },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } finally {
    if (finallyCallback) finallyCallback();
  }
};

export default handleAPICall;
