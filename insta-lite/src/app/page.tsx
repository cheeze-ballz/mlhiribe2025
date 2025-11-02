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

import { Heart, MessageCircle, Send, Camera, PlusCircle, Loader2, MapPin, LogOut } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/auth";
import { Login } from "@/components/login";
import { usePosts } from "@/lib/usepost";
import type { Post } from "@/lib/types";
import { Composer } from "@/components/composer";

/* ========================== Utilities ========================== */
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ========================== Header ========================== */
function HeaderBar() {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <Camera className="h-6 w-6" />
        <span className="font-bold tracking-tight text-xl">LinkUp</span>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.handle}</span>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================== Post Card ========================== */
/* ========================== Post Card ========================== */
function PostCard({
  post,
  onLike,
  onDelete,
  onJoin,
  currentUserId,
}: {
  post: Post;
  onLike: (id: string) => void;
  onDelete?: (id: string) => void;
  onJoin?: (id: string) => void;
  currentUserId?: string;
}) {
  const hasPhoto = Boolean(post.imageUrl);
  const hasMap = Boolean(post.location);

  const joined = post.participants?.includes(currentUserId || "");
  const canJoin = post.maxParticipants && (!joined && (post.participants?.length || 0) < post.maxParticipants);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center gap-3 py-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="leading-tight flex-1">
            <div className="font-semibold">{post.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {post.user.handle} · {timeAgo(post.createdAt)}
            </div>
          </div>

          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(post.id)} title="Delete Post">
              Delete
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {hasPhoto && <img src={post.imageUrl!} alt={post.caption} className="w-full aspect-video object-cover" />}
          {hasMap && (
            <div className={`${hasPhoto ? "border-t" : ""}`}>
              <MapPreview position={post.location!} height={160} zoom={15} />
              {post.placeName && <div className="px-3 py-2 text-sm text-muted-foreground">📍 {post.placeName}</div>}
            </div>
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

          {/* PARTICIPANTS */}
          {post.maxParticipants && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span>{post.participants?.length || 0} / {post.maxParticipants} joined</span>
              {canJoin && onJoin && (
                <Button size="sm" variant="outline" onClick={() => onJoin(post.id)}>Join</Button>
              )}
              {joined && <Badge variant="secondary">Joined</Badge>}
            </div>
          )}

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




/* ========================== Feed ========================== */
function Feed({ userId, currentUserId }: { userId: string; currentUserId: string }) {
  const { posts, toggleLike, addPost, deletePost, joinPost, loading } = usePosts(userId);
  const sorted = useMemo(() => [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [posts]);

  return (
    <div className="space-y-4">
      <Composer onCreate={addPost} />
      <Separator />
      {sorted.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={currentUserId}
          onLike={toggleLike}
          onDelete={deletePost}
          onJoin={joinPost ? (id) => joinPost(id, currentUserId) : undefined}
        />
      ))}
    </div>
  );
}






/* ========================== Main Page ========================== */
export default function InstaLitePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-background text-foreground">
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
  <Feed userId={user.id} currentUserId={user.id} />
</TabsContent>

<TabsContent value="discover">
  <Discover currentUserId={user.id} />
</TabsContent>


          {/* Profile info */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{user.handle}</CardTitle>
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


/* ========================== Discover ========================== */
function Discover({ currentUserId }: { currentUserId: string }) {
  const { posts, toggleLike, joinPost, fetchPosts, loading } = usePosts();
  const sorted = useMemo(() => [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [posts]);

  useEffect(() => {
    fetchPosts(false);
  }, []);

  return (
    <div className="space-y-4">
      {sorted.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={currentUserId}
          onLike={toggleLike}
          onJoin={joinPost ? (id) => joinPost(id, currentUserId) : undefined}
        />
      ))}
    </div>
  );
}


/* ========================== Map components ========================== */
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
