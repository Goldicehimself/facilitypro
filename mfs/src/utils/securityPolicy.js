export const normalizeAllowedDomains = (domains = []) => {
  const list = Array.isArray(domains) ? domains : [];
  return list
    .map((d) => String(d || '').trim().toLowerCase())
    .filter(Boolean);
};

export const isEmailAllowedByPolicy = (email, policy) => {
  if (!policy?.restrictInviteDomains) return true;
  const domain = String(email || '').split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const allowed = Array.isArray(policy.allowedInviteDomains)
    ? normalizeAllowedDomains(policy.allowedInviteDomains)
    : normalizeAllowedDomains(
        String(policy.allowedInviteDomains || '').split(',')
      );
  if (allowed.length === 0) return false;
  return allowed.includes(domain);
};
