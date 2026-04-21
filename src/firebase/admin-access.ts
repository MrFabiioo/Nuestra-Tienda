export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAdminAllowedEmailAllowlist(adminAllowedEmails?: string) {
  return new Set(
    (adminAllowedEmails ?? '')
      .split(',')
      .map(normalizeAdminEmail)
      .filter(Boolean),
  );
}

export function isAdminEmailAllowed(email: string | undefined, adminAllowedEmails?: string) {
  if (!email) return false;

  const allowlist = getAdminAllowedEmailAllowlist(adminAllowedEmails);
  if (allowlist.size === 0) return false;

  return allowlist.has(normalizeAdminEmail(email));
}
