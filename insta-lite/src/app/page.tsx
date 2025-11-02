"use client";
import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Send, Camera, PlusCircle, Loader2, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Login } from "@/components/login";

// ---------------------------------------------
// InstaLite – a tiny Instagram/BeReal‑style demo
// ---------------------------------------------
// Usage:
// • Next.js (App Router): put this file at app/page.tsx and export default component
// • Vite/CRA: use as <InstaLite /> in your App
// Styling: Tailwind classes + shadcn/ui components are used for fast, clean UI.
// ---------------------------------------------

export type Post = {
  id: string;
  user: { name: string; handle: string; avatar?: string };
  imageUrl: string;
  caption: string;
  liked: boolean;
  likes: number;
  comments: number;
  createdAt: string; // ISO
  tags?: string[];
};

function useDemoPosts() {
  const [posts, setPosts] = useState<Post[]>(() => [
    {
      id: "1",
      user: { name: "Jason", handle: "@jason", avatar: "https://picsum.photos/seed/jason/80" },
      imageUrl: "https://picsum.photos/seed/track/900/600",
      caption: "First lap felt smooth. Any tips for the chicane?",
      liked: false,
      likes: 12,
      comments: 4,
      createdAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      tags: ["race", "telemetry"],
    },
    {
      id: "2",
      user: { name: "SJ", handle: "@sjyu", avatar: "https://picsum.photos/seed/sj/80" },
      imageUrl: "https://picsum.photos/seed/cats/900/600",
      caption: "Dual‑cam BeReal test 😅",
      liked: true,
      likes: 33,
      comments: 9,
      createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      tags: ["bereal", "dualcam"],
    },
  ]);

  const toggleLike = (id: string) =>
    setPosts((arr) =>
      arr.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    );

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

function HeaderBar() {
  const { user, logout } = useAuth();
  
  return (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <Camera className="h-6 w-6" />
        <span className="font-bold tracking-tight text-xl">InstaLite</span>
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

function Composer({ onCreate }: { onCreate: (p: Post) => void }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFakeUpload = async () => {
    if (!caption || !user) return;
    setBusy(true);
    // Simulate an upload + storage URL
    await new Promise((r) => setTimeout(r, 800));
    const seed = Math.random().toString(36).slice(2);
    onCreate({
      id: crypto.randomUUID(),
      user: { name: user.name, handle: user.handle, avatar: user.avatar },
      imageUrl: `https://picsum.photos/seed/${seed}/1200/900`,
      caption,
      liked: false,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      tags: caption
        .split(/\s+/)
        .filter((w) => w.startsWith("#"))
        .map((t) => t.replace(/[^#\w-]/g, "")),
    });
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  };

  if (!user) return null;

  return (
    <Card className="border-muted/60">
      <CardHeader className="flex flex-row items-center gap-3 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-base font-medium">Create a post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input ref={fileRef} type="file" accept="image/*" className="hidden" />
          <Button variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
            <PlusCircle className="h-4 w-4" /> Choose photo
          </Button>
          <span className="text-sm text-muted-foreground">(mocked upload for demo)</span>
        </div>
        <Textarea
          placeholder="Write a caption… #tags"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-20"
        />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={() => setCaption("")}>Clear</Button>
        <Button onClick={handleFakeUpload} disabled={!caption || busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
        </Button>
      </CardFooter>
    </Card>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
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
          <img src={post.imageUrl} alt={post.caption} className="w-full aspect-video object-cover" />
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
