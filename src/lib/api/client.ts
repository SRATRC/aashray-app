// src/lib/api/client.ts
import * as Sentry from '@sentry/react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { ApiError } from './types';

import { resolveApiBaseUrl } from '@/lib/api/resolveBaseUrl';

const generateRequestId = () =>
  Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  allowToast?: boolean;
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  config: RequestConfig = {}
): Promise<T> {
  const { params, headers = {}, allowToast = true } = config;
  const requestId = generateRequestId();
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    console.error('Base URL is undefined. Check your .env file and constants.');
    throw new ApiError({
      message: 'Network configuration error: Base URL is missing.',
      correlationId: requestId,
    });
  }

  let data: unknown = body;
  const finalHeaders: Record<string, string> = { 'x-request-id': requestId, ...headers };

  // Preserve the legacy pfp multipart special-case (mirrors `body?.image`).
  const imageUri = (body as { image?: string } | undefined)?.image;
  if (imageUri) {
    const form = new FormData();
    // @ts-expect-error RN FormData file shape
    form.append('image', {
      uri: imageUri,
      name: 'pfp.jpg',
      type: 'image/jpeg',
    });
    data = form;
    finalHeaders['Content-Type'] = 'multipart/form-data';
  }

  if (__DEV__) {
    console.log('------------');
    console.log('URL: ', `${baseUrl}${endpoint}`);
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

  try {
    const res = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      params,
      data,
      headers: finalHeaders,
      validateStatus: () => true,
    });

    if (res.status === 200 || res.status === 201) {
      return res.data as T;
    }

    throw new ApiError({
      message: res.data?.message || 'An error occurred',
      status: res.status,
      data: res.data,
      correlationId: (res.headers?.['x-request-id'] as string) || requestId,
    });
  } catch (error: any) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError({
            message: error?.response?.data?.message || error?.message || 'An error occurred',
            status: error?.response?.status,
            data: error?.response?.data,
            correlationId: error?.response?.headers?.['x-request-id'] || requestId,
          });

    if (__DEV__) console.log('ERROR: ', apiError.message);

    Sentry.addBreadcrumb({
      category: 'api.error',
      message: `${endpoint} failed: ${apiError.message}`,
      data: { status: apiError.status, data: apiError.data, correlationId: apiError.correlationId },
      level: 'error',
    });
    Sentry.setTag('correlation_id', apiError.correlationId);

    if (allowToast) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: apiError.message,
        swipeable: false,
        text1Style: { color: 'red' },
        text2Style: { color: 'black', fontWeight: 'bold', fontSize: 14 },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    throw apiError;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>('get', endpoint, undefined, config),
  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('post', endpoint, body, config),
  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('put', endpoint, body, config),
  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('patch', endpoint, body, config),
  del: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>('delete', endpoint, undefined, config),
};
