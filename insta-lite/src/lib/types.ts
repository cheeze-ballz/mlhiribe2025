type Post = {
    id: string;
    user: User;
    caption: string;
    createdAt: string;
    imageUrl?: string;
    location?: { lat: number; lng: number };
    placeName?: string;
    tags?: string[];
    likes: number;
    liked: boolean;
    comments: number;
  
    // NEW FIELDS
    maxParticipants?: number;   // optional max number
    participants?: string[];    // array of user IDs who joined
  };
  