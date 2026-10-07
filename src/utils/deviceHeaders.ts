import axios from 'axios';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

// Sent on every request so the backend can decide updates per device (never
// forcing an update this OS can't install) and count devices per OS before we
// raise the minimum OS. iOS sends its version ("16.4"); Android its API level ("26").
export const deviceHeaders = {
  'x-platform': Platform.OS,
  'x-app-version': Application.nativeApplicationVersion ?? '',
  'x-os-version': String(Platform.Version),
};

Object.assign(axios.defaults.headers.common, deviceHeaders);
