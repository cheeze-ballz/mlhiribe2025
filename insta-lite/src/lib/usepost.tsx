"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Post } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Row from activities
type ActivityRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  created_at: string;
  image_url: string | null;
  tags: string[] | null;
  likes_count: number | null;
  location_lat: number | null;
  location_lng: number | null;
  place_name: string | null;
};

// Row from profiles (separate fetch)
type ProfileRow = {
  id: string;
  name: string | null;
  handle: string | null;
  avatar: string | null;
};

function makePost(a: ActivityRow, prof?: ProfileRow): Post {
  return {
    id: a.id,
    user: {
      id: prof?.id ?? a.creator_id,
      name: prof?.name ?? "User",
      handle: prof?.handle ?? "@user",
      avatar: prof?.avatar ?? undefined,
    },
    caption: a.title,
    imageUrl: a.image_url ?? undefined,
    createdAt: a.created_at,
    liked: false,
    likes: a.likes_count ?? 0,
    comments: 0,
    tags: a.tags ?? [],
    location:
      a.location_lat != null && a.location_lng != null
        ? { lat: a.location_lat, lng: a.location_lng }
        : undefined,
    placeName: a.place_name ?? undefined,
  };
}

export function usePosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(
    async (onlyMine = !!userId) => {
      setLoading(true);
      try {
        // 1) fetch activities
        let q = supabase
          .from("activities")
          .select(
            `
              id,
              creator_id,
              title,
              description,
              created_at,
              image_url,
              tags,
              likes_count,
              location_lat,
              location_lng,
              place_name
            `
          )
          .order("created_at", { ascending: false });

        if (onlyMine && userId) q = q.eq("creator_id", userId);

        const { data: acts, error: aErr } = await q;
        if (aErr) {
          console.error("Supabase activities fetch error:", aErr.message || aErr);
          setPosts([]);
          return;
        }
        const activities = (acts ?? []) as ActivityRow[];
        if (activities.length === 0) {
          setPosts([]);
          return;
        }

        // 2) batch fetch profiles for all creator_ids
        const ids = Array.from(new Set(activities.map(a => a.creator_id)));
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id,name,handle,avatar")
          .in("id", ids);

        if (pErr) {
          console.warn("profiles fetch warning (fallback to User):", pErr.message || pErr);
        }

        const profMap = new Map<string, ProfileRow>(
          (profs ?? []).map((p) => [p.id, p as ProfileRow])
        );

        // 3) hydrate
        const mapped: Post[] = activities.map(a => makePost(a, profMap.get(a.creator_id)));
        setPosts(mapped);
      } catch (err: any) {
        console.error("Error fetching posts:", err?.message || err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchPosts(!!userId);
  }, [userId, fetchPosts]);

  const addPost = useCallback(
    async (p: Post) => {
      try {
        const payload = {
          title: p.caption,
          creator_id: p.user.id,
          description: "",
          image_url: p.imageUrl ?? null,
          tags: p.tags ?? null,
          likes_count: p.likes ?? 0,
          location_lat: p.location?.lat ?? null,
          location_lng: p.location?.lng ?? null,
          place_name: p.placeName ?? null,
        };
        const { error } = await supabase.from("activities").insert(payload);
        if (error) {
          console.error("Supabase insert error:", error.message || error);
          return false;
        }
        await fetchPosts(!!userId);
        return true;
      } catch (err: any) {
        console.error("Failed to add post:", err?.message || err);
        return false;
      }
    },
    [fetchPosts, userId]
  );

  const deletePost = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete error:", error.message || error);
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Failed to delete post:", err?.message || err);
    }
  }, []);

  const toggleLike = useCallback((id: string) => {
    setPosts((arr) =>
      arr.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
    // (optional) persist likes_count with an update
    // supabase.from("activities").update({ likes_count: newLikes }).eq("id", id)
  }, []);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [posts]
  );

  return { posts: sorted, loading, fetchPosts, addPost, deletePost, toggleLike, setPosts };
}
