import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

export async function fetchReports(rangeDays = 30) {
  const response = await axiosInstance.get('/reports/analytics', {
    params: { range: rangeDays }
  });
  return response.data?.data;
}

export async function fetchReportWarnings() {
  const response = await axiosInstance.get('/reports/warnings', { suppressToast: true });
  const payload = response.data?.data;
  return payload?.warnings || [];
}

export async function exportReport(format = 'csv', rangeDays = 30) {
  try {
    const response = await axiosInstance.post(
      '/reports/export',
      { format, range: rangeDays },
      { responseType: 'blob' }
    );
    return response;
  } catch (error) {
    logger.error('Error exporting report:', error);
  }
}
