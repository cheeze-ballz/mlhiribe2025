export async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
  
      if (!Array.isArray(data)) {
        console.error("Expected array but got:", data);
        setPosts([]);
        return;
      }
  
      const mapped: Post[] = data.map((a: any) => ({
        id: a.id,
        user: {
          name: a.user_name || "Unknown",
          handle: a.user_handle || "@anon",
          avatar: a.user_avatar,
        },
        caption: a.title,
        liked: false,
        likes: a.joined ?? 0,
        comments: 0,
        createdAt: a.created_at,
        location: a.location,
        placeName: "",
        tags: [],
        imageUrl: undefined,
      }));
  
      setPosts(mapped.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    } catch (err) {
        console.error(err);
      }
}