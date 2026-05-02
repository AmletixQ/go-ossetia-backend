const BASE_URL = "https://geocode-maps.yandex.ru/v1/";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  precision?: string;
}

export class AddressNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AddressNotFoundError";
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address.trim()) throw new Error("Адрес не может быть пустым");

  const apiKey = process.env.YANDEX_GEOCODER_API_KEY;
  if (!apiKey)
    throw new Error("YANDEX_GEOCODER_API_KEY не настроен в окружении");

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      geocode: address.trim(),
      format: "json",
      results: "1",
      lang: "ru_RU",
    });

    const url = `${BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as any;

    const featureMember = data?.response?.GeoObjectCollection?.featureMember;

    if (!featureMember || featureMember.length === 0)
      throw new AddressNotFoundError(`Не удалось найти адрес: ${address}`);

    const feature = featureMember[0].GeoObject;

    if (!feature?.Point?.pos)
      throw new AddressNotFoundError(`Не удалось найти адрес: ${address}`);

    const [lon, lat] = feature.Point.pos.split(" ").map(Number);
    const meta = feature.metaDataProperty?.GeocoderMetaData;

    return {
      latitude: lat,
      longitude: lon,
      formattedAddress: meta?.Address?.formatted,
      precision: meta?.precision,
    };
  } catch (err: any) {
    if (err instanceof AddressNotFoundError) throw err;
    throw new Error(`Ошибка геокодирования: ${err.message}`);
  }
}
