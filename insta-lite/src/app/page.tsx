"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Send, Camera, PlusCircle, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

/* ---- Free reverse-geocoder (OSM Nominatim; light/dev use) ---- */
async function reverseGeocodeFree(lat: number, lng: number): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    return data?.name || data?.display_name;
  } catch {
    return;
  }
}

/* ========== Leaflet MapPicker (SSR-safe) ========== */
const MapPicker = dynamic(async () => {
  const L = await import("leaflet");
  const RL = await import("react-leaflet");
  const { MapContainer, TileLayer, Marker, useMapEvents } = RL;

  // fix marker icons in bundlers
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
  }> = ({ value, onChange, height = 260, zoom = 15 }) => {
    const [center, setCenter] = useState(value ?? { lat: 38.9897, lng: -76.9378 });
    const [marker, setMarker] = useState(value ?? center);

    useEffect(() => {
      if (!value && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(c); setMarker(c); onChange(c);
        });
      }
    }, [value, onChange]);

    const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    return (
      <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url={url} />
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

/* ========== Leaflet MapPreview (mini map in posts) ========== */
const MapPreview = dynamic(async () => {
  const RL = await import("react-leaflet");
  const { MapContainer, TileLayer, Marker } = RL;

  const Comp: React.FC<{ position: { lat: number; lng: number }; height?: number; zoom?: number }> = ({
    position, height = 180, zoom = 15
  }) => {
    const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    return (
      <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url={url} />
        <Marker position={position} />
      </MapContainer>
    );
  };
  return Comp;
}, { ssr: false });

/* ========================= Types + demo ========================= */
export type Post = {
  id: string;
  user: { name: string; handle: string; avatar?: string };
  imageUrl?: string;                 // may be missing -> show only map
  caption: string;
  liked: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  tags?: string[];
  location?: { lat: number; lng: number };
  placeName?: string;
};

function useDemoPosts() {
  const [posts, setPosts] = useState<Post[]>(() => [
    {
      id: "1",
      user: { name: "Jason", handle: "@jason", avatar: "https://picsum.photos/seed/jason/80" },
      imageUrl: "https://picsum.photos/seed/track/900/600",
      caption: "Gym? 6pm. College Park.",
      liked: false,
      likes: 12,
      comments: 4,
      createdAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      tags: ["gym"],
      location: { lat: 38.9897, lng: -76.9378 },
      placeName: "McKeldin Library",
    },
  ]);

  const toggleLike = (id: string) =>
    setPosts((arr) => arr.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)));

  const addPost = (p: Post) => setPosts((arr) => [p, ...arr]);

  return { posts, toggleLike, addPost };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ============================= UI bits ============================= */
function HeaderBar() {
  return (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <Camera className="h-6 w-6" />
        <span className="font-bold tracking-tight text-xl">InstaLite</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">Leaflet</Badge>
        </div>
      </div>
    </div>
  );
}

/* =============================== Composer =============================== */
function Composer({ onCreate }: { onCreate: (p: Post) => void }) {
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [placeName, setPlaceName] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const go = async () => {
      if (!loc) { setPlaceName(undefined); return; }
      const name = await reverseGeocodeFree(loc.lat, loc.lng);
      if (alive) setPlaceName(name);
    };
    const t = setTimeout(go, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [loc]);

  const handleCreate = async () => {
    if (!caption && !loc && !(fileRef.current?.files?.[0])) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    const seed = Math.random().toString(36).slice(2);
    const file = fileRef.current?.files?.[0];
    const imageUrl = file ? `https://picsum.photos/seed/${seed}/1200/900` : undefined; // mock

    onCreate({
      id: crypto.randomUUID(),
      user: { name: "You", handle: "@you", avatar: "https://picsum.photos/seed/you/80" },
      imageUrl,
      caption,
      liked: false,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      tags: caption
        .split(/\s+/)
        .filter((w) => w.startsWith("#"))
        .map((t) => t.replace(/[^#\w-]/g, "")),
      location: loc,
      placeName,
    });

    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    setLoc(undefined);
    setPlaceName(undefined);
    setBusy(false);
  };

  return (
    <Card className="border-muted/60">
      {/* Leaflet CSS once on this page */}
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>

      <CardHeader className="flex flex-row items-center gap-3 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://picsum.photos/seed/you/80" alt="you" />
          <AvatarFallback>YOU</AvatarFallback>
        </Avatar>
        <CardTitle className="text-base font-medium">Create a post</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input ref={fileRef} type="file" accept="image/*" className="hidden" />
          <Button variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
            <PlusCircle className="h-4 w-4" /> Choose photo
          </Button>
          <span className="text-sm text-muted-foreground">(photo optional)</span>
        </div>

        {/* Map picker */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" /> Pin a location (optional)
          </div>
          <MapPicker value={loc} onChange={setLoc} height={260} zoom={15} />
          {loc && (
            <div className="text-xs text-muted-foreground">
              Selected: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
            </div>
          )}
          {placeName && (
            <div className="text-xs text-muted-foreground">Looks like: {placeName}</div>
          )}
        </div>

        <Textarea
          placeholder="Write a caption… #tags"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-20"
        />
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={() => { setCaption(""); setLoc(undefined); setPlaceName(undefined); }}>
          Clear
        </Button>
        <Button onClick={handleCreate} disabled={busy || (!caption && !loc)} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
        </Button>
      </CardFooter>
    </Card>
  );
}

/* =============================== Post Card =============================== */
function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const hasPhoto = Boolean(post.imageUrl);
  const hasMap = Boolean(post.location);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 py-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="font-semibold">{post.user.name}</div>
            <div className="text-xs text-muted-foreground">{post.user.handle} · {timeAgo(post.createdAt)}</div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* If no photo -> show only map */}
          {hasMap && (
            <div className={hasPhoto ? "border-b" : ""}>
              <MapPreview position={post.location!} height={180} zoom={15} />
              {post.placeName && (
                <div className="px-3 py-2 text-sm text-muted-foreground">📍 {post.placeName}</div>
              )}
            </div>
          )}

          {hasPhoto && (
            <img src={post.imageUrl!} alt={post.caption} className="w-full aspect-video object-cover" />
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3">
          <div className="flex items-center gap-3 pt-2">
            <Button size="icon" variant={post.liked ? "default" : "secondary"} onClick={() => onLike(post.id)}>
              <Heart className={`h-5 w-5 ${post.liked ? "fill-current" : ""}`} />
            </Button>
            <Button size="icon" variant="secondary">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <div className="ml-1 text-sm text-muted-foreground">
              <span className="font-medium">{post.likes}</span> likes · {post.comments} comments
            </div>
          </div>

          <div className="text-sm">
            <span className="font-semibold mr-2">{post.user.name}</span>
            {post.caption}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

/* ================================== Feed ================================== */
function Feed() {
  const { posts, toggleLike, addPost } = useDemoPosts();
  const sorted = useMemo(() => [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [posts]);

  return (
    <div className="space-y-4">
      <Composer onCreate={addPost} />
      <Separator />
      <div className="space-y-4">
        {sorted.map((p) => (
          <PostCard key={p.id} post={p} onLike={toggleLike} />
        ))}
      </div>
    </div>
  );
}

export default function InstaLite() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Leaflet CSS for this page */}
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>

      <HeaderBar />
      <main className="mx-auto max-w-2xl p-4">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <Feed />
          </TabsContent>

          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>Coming soon</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Hashtag search, recommendations, infinite scroll…
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>@you</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your posts, followers, following, edit profile…
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
