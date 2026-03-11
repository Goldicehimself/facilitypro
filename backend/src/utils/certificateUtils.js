const getCertificateStatus = (cert) => {
  if (!cert) return null;
  if (typeof cert === 'string') return 'approved';
  return cert.status || 'approved';
};

const isApprovedCertificate = (cert) => getCertificateStatus(cert) === 'approved';
const isPendingCertificate = (cert) => getCertificateStatus(cert) === 'pending';

const countApprovedCertificates = (certs = []) =>
  Array.isArray(certs) ? certs.filter(isApprovedCertificate).length : 0;

const countPendingCertificates = (certs = []) =>
  Array.isArray(certs) ? certs.filter(isPendingCertificate).length : 0;

module.exports = {
  getCertificateStatus,
  isApprovedCertificate,
  isPendingCertificate,
  countApprovedCertificates,
  countPendingCertificates
};
