export interface Coords {
  lat: number;
  lng: number;
}

export async function getCurrentLocation(): Promise<Coords | null> {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}
