export interface AdImage {
  src: string; // base64 data URL
  prompt: string;
}

// Fix: Add AdIdea interface to resolve import error in IdeaCard.tsx.
export interface AdIdea {
  title: string;
  description: string;
}
