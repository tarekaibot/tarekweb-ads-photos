export interface AdImage {
  src: string; // base64 data URL
  prompt: string;
}

export interface AdIdea {
  title: string;
  description: string; // This will hold the ad copy
  imagePrompt: string; // This is the new field for image generation
}
