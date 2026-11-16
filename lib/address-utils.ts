export const PRIMARY_PHONE_REGEX = /^09\d{9}$/;
export const SECONDARY_PHONE_REGEX = /^0(9\d{9}|[1-8]\d{9})$/;
export const POSTAL_CODE_REGEX = /^\d{10}$/;

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function normalizePhoneInput(input: string): string {
  return toEnglishDigits(input).replace(/[\s\-()]/g, "");
}

export function normalizePostalCodeInput(input: string): string {
  return toEnglishDigits(input).replace(/[\s\-()]/g, "");
}

export interface StructuredAddressLike {
  province?: string | { name: string } | null;
  city?: string | { name: string } | null;
  streetAddress?: string | null;
  plaque?: string | null;
  floor?: string | null;
  unit?: string | null;
  addressLine?: string | null;
}

export function getProvinceName(
  province?: string | { name: string } | null
): string {
  if (!province) return "";
  return typeof province === "string" ? province : province.name;
}

export function getCityName(city?: string | { name: string } | null): string {
  if (!city) return "";
  return typeof city === "string" ? city : city.name;
}

export function formatAddressSummary(addr: StructuredAddressLike): string {
  const provinceName = getProvinceName(addr.province);
  const cityName = getCityName(addr.city);

  if (addr.streetAddress && addr.plaque) {
    return [
      provinceName,
      cityName,
      addr.streetAddress,
      `پلاک ${addr.plaque}`,
      addr.floor ? `طبقه ${addr.floor}` : null,
      addr.unit ? `واحد ${addr.unit}` : null,
    ]
      .filter(Boolean)
      .join("، ");
  }

  return [provinceName, cityName, addr.addressLine].filter(Boolean).join("، ");
}
