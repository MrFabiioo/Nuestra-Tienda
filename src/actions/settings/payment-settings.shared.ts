import { db, eq, SiteSettings, sql } from 'astro:db';
import { PAYMENT_METHODS } from '../../services/orders/constants';

export const PAYMENT_QR_KEY = 'payment_qr_image';
export const PAYMENT_BANCOLOMBIA_KEY = 'payment_bancolombia';
export const PAYMENT_NEQUI_KEY = 'payment_nequi';

export const MANAGED_PAYMENT_METHODS = [PAYMENT_METHODS.bancolombia, PAYMENT_METHODS.nequi] as const;
export type ManagedPaymentMethod = typeof MANAGED_PAYMENT_METHODS[number];

export type PaymentQrValue = {
  url: string;
  publicId: string;
  uploadedAt: string;
};

export type BancolombiaPaymentValue = {
  accountType: string;
  accountNumber: string;
  holderName: string;
  note?: string;
};

export type NequiPaymentValue = {
  phoneNumber: string;
  holderName: string;
  note?: string;
};

export type PaymentMethodConfigMap = {
  [PAYMENT_METHODS.bancolombia]: BancolombiaPaymentValue;
  [PAYMENT_METHODS.nequi]: NequiPaymentValue;
};

export type PaymentSettingsSnapshot = {
  bancolombia: BancolombiaPaymentValue | null;
  nequi: NequiPaymentValue | null;
  qr: PaymentQrValue | null;
};

const PAYMENT_SETTING_KEYS: Record<ManagedPaymentMethod, string> = {
  [PAYMENT_METHODS.bancolombia]: PAYMENT_BANCOLOMBIA_KEY,
  [PAYMENT_METHODS.nequi]: PAYMENT_NEQUI_KEY,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown) {
  const normalized = getString(value);
  return normalized.length > 0 ? normalized : undefined;
}

function parseQrValue(raw: string): PaymentQrValue | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const url = getString(parsed.url);
    const publicId = getString(parsed.publicId);
    const uploadedAt = getString(parsed.uploadedAt);

    if (!url || !publicId || !uploadedAt) return null;

    return { url, publicId, uploadedAt };
  } catch {
    return null;
  }
}

function parseBancolombiaValue(raw: string): BancolombiaPaymentValue | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const accountType = getString(parsed.accountType);
    const accountNumber = getString(parsed.accountNumber);
    const holderName = getString(parsed.holderName);
    const note = normalizeOptionalString(parsed.note);

    if (!accountType || !accountNumber || !holderName) return null;

    return { accountType, accountNumber, holderName, note };
  } catch {
    return null;
  }
}

function parseNequiValue(raw: string): NequiPaymentValue | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const phoneNumber = getString(parsed.phoneNumber);
    const holderName = getString(parsed.holderName);
    const note = normalizeOptionalString(parsed.note);

    if (!phoneNumber || !holderName) return null;

    return { phoneNumber, holderName, note };
  } catch {
    return null;
  }
}

export async function readPaymentQrSetting() {
  const [row] = await db
    .select()
    .from(SiteSettings)
    .where(eq(SiteSettings.key, PAYMENT_QR_KEY));

  if (!row) return null;

  return parseQrValue(row.value);
}

export async function readManagedPaymentSetting(method: ManagedPaymentMethod) {
  if (method === PAYMENT_METHODS.bancolombia) {
    return readBancolombiaSetting();
  }

  return readNequiSetting();
}

export async function readBancolombiaSetting() {
  const [row] = await db
    .select()
    .from(SiteSettings)
    .where(eq(SiteSettings.key, PAYMENT_BANCOLOMBIA_KEY));

  if (!row) return null;

  return parseBancolombiaValue(row.value);
}

export async function readNequiSetting() {
  const [row] = await db
    .select()
    .from(SiteSettings)
    .where(eq(SiteSettings.key, PAYMENT_NEQUI_KEY));

  if (!row) return null;

  return parseNequiValue(row.value);
}

export async function readPaymentSettingsSnapshot(): Promise<PaymentSettingsSnapshot> {
  const [bancolombia, nequi, qr] = await Promise.all([
    readBancolombiaSetting(),
    readNequiSetting(),
    readPaymentQrSetting(),
  ]);

  return {
    bancolombia,
    nequi,
    qr,
  };
}

export async function upsertSiteSetting(key: string, value: unknown) {
  const now = new Date();
  const serialized = JSON.stringify(value);

  await db.run(sql`
    insert into ${SiteSettings} (key, value, updatedAt)
    values (${key}, ${serialized}, ${now})
    on conflict(key) do update set
      value = ${serialized},
      updatedAt = ${now}
  `);
}

export async function deleteSiteSetting(key: string) {
  await db.delete(SiteSettings).where(eq(SiteSettings.key, key));
}

export function getManagedPaymentSettingKey(method: ManagedPaymentMethod) {
  return PAYMENT_SETTING_KEYS[method];
}
