export type Post = {
    id: string;
    user: { 
      name: string; 
      handle: string; 
      avatar?: string; 
    };
    imageUrl?: string;
    caption: string;
    liked: boolean;
    likes: number;
    comments: number;
    createdAt: string;
    tags?: string[];
    location?: { lat: number; lng: number };
    placeName?: string;
  };
  