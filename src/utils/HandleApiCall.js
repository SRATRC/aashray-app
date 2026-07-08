import { apiClient } from '../lib/api/client';

// Legacy callback-style wrapper — now delegates to the promise-based apiClient.
// New code should import apiClient directly; this shim exists so the ~45
// existing call sites keep working until they are migrated (Phase 3) and it
// is removed (Phase 4).
const handleAPICall = async (
  method,
  endpoint,
  params,
  body,
  successCallback,
  finallyCallback = () => {},
  errorCallback = (_error) => {},
  allowToast = true
) => {
  const m = String(method).toLowerCase();
  try {
    let data;
    if (m === 'get') {
      data = await apiClient.get(endpoint, { params, allowToast });
    } else if (m === 'delete') {
      data = await apiClient.del(endpoint, body, { params, allowToast });
    } else {
      data = await apiClient[m](endpoint, body, { params, allowToast });
    }
    if (successCallback) successCallback(data);
  } catch (error) {
    // apiClient already showed the toast/haptic when allowToast is true.
    if (errorCallback) {
      errorCallback({
        message: error.message,
        status: error.status,
        data: error.data,
        correlationId: error.correlationId,
        originalError: error,
      });
    }
  } finally {
    if (finallyCallback) finallyCallback();
  }
};

export default handleAPICall;
