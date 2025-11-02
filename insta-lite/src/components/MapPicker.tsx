const MapPicker = dynamic(async () => {
  const L = await import("leaflet");
  const RL = await import("react-leaflet");
  const { MapContainer, TileLayer, Marker, useMapEvents } = RL;

  // Fix marker icons
  // @ts-ignore
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
    return null;
  }

  const Comp: React.FC<{
    value?: { lat: number; lng: number };
    onChange: (v: { lat: number; lng: number }) => void;
    height?: number;
    zoom?: number;
  }> = ({ value, onChange, height = 220, zoom = 15 }) => {
    const [center, setCenter] = React.useState(value ?? { lat: 38.9897, lng: -76.9378 });
    const [marker, setMarker] = React.useState(value ?? center);

    React.useEffect(() => {
      if (!value && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(c); setMarker(c); onChange(c);
        });
      }
    }, [value, onChange]);

    const key = (process.env.NEXT_PUBLIC_MAPTILER_KEY as string) || "";
    const url = key
      ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${key}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    return (
      <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors {MapTiler if used}" url={url} />
        <Marker
          position={marker}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const m = e.target.getLatLng();
              const v = { lat: m.lat, lng: m.lng };
              setMarker(v); onChange(v);
            },
          }}
        />
        <ClickHandler onPick={(lat, lng) => { const v = { lat, lng }; setMarker(v); onChange(v); }} />
      </MapContainer>
    );
  };

  return Comp;
}, { ssr: false });
