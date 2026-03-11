import api from './axiosConfig';

export async function requestPasswordReset(email, orgCode) {
  const response = await api.post('/auth/forgot-password', { email, orgCode }, { suppressToast: true });
  return response.data?.data;
}

export async function resetPassword({ token, orgCode, password }) {
  const response = await api.post('/auth/reset-password', { token, orgCode, password }, { suppressToast: true });
  return response.data?.data;
}

export async function resendUserVerification({ email, orgCode }) {
  const response = await api.post('/auth/resend-verify-user-email', { email, orgCode }, { suppressToast: true });
  return response.data?.data;
}
