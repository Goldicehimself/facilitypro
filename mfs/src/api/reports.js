import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

export async function fetchReports() {
  const response = await axiosInstance.get('/reports');
  return response.data?.data;
}

export async function fetchReportWarnings() {
  const response = await axiosInstance.get('/reports/warnings', { suppressToast: true });
  const payload = response.data?.data;
  return payload?.warnings || [];
}

export async function exportReport(format = 'pdf') {
  try {
    const response = await axiosInstance.post('/reports/export', { format });
    return response.data?.data;
  } catch (error) {
    logger.error('Error exporting report:', error);
  }
}
