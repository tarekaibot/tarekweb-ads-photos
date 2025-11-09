import { GoogleGenAI, Modality, Type } from '@google/genai';
import { AdImage } from '../types';

let ai: GoogleGenAI | null = null;

// This function fetches the API key, initializes the AI client, and caches it.
const getAiClient = async (): Promise<GoogleGenAI> => {
    if (ai) {
        return ai;
    }

    try {
        // Fetch the key from our Netlify serverless function
        const response = await fetch('/.netlify/functions/get-api-key');
        if (!response.ok) {
            throw new Error(`Failed to fetch API key (status: ${response.status})`);
        }
        const { apiKey } = await response.json();
        if (!apiKey) {
            throw new Error("API key was not returned from the server.");
        }
        
        // Initialize the client and cache it
        ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        console.error("Error initializing GoogleGenAI client:", error);
        throw new Error("لا يمكن تهيئة خدمة الذكاء الاصطناعي. يرجى التأكد من أن مفتاح API الخاص بك قد تم إعداده بشكل صحيح في Netlify.");
    }
};


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

/**
 * Step 1: Generate dynamic, creative ad concepts based on the product image.
 */
const generateAdConcepts = async (imagePart: { inlineData: { data: string; mimeType: string; } }): Promise<string[]> => {
  const aiClient = await getAiClient();
  const model = 'gemini-2.5-flash';
  const prompt = `
    بصفتك مدير إبداعي خبير، قم بتحليل صورة المنتج هذه واقتراح 6 أفكار إعلانية مبتكرة وفريدة من نوعها.
    يجب أن تكون كل فكرة مختلفة تمامًا عن الأخرى، وتغطي سيناريوهات متنوعة (مثل الفخامة، الاستخدام اليومي، الفن التجريدي، الطبيعة، إلخ).
    قدم الأفكار كنصوص توجيهية (prompts) مباشرة يمكن استخدامها لتوليد صور.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      prompts: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "قائمة من 6 نصوص توجيهية لتوليد الصور الإعلانية."
      }
    },
    required: ["prompts"]
  };

  const response = await aiClient.models.generateContent({
    model,
    contents: {
      parts: [imagePart, { text: prompt }],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse.prompts;
};

/**
 * Step 2: Generate ad images based on the dynamically generated concepts.
 */
export const generateAdImages = async (productImage: File): Promise<AdImage[]> => {
  const aiClient = await getAiClient();
  const imagePart = await fileToGenerativePart(productImage);

  console.log("Generating ad concepts...");
  const adConcepts = await generateAdConcepts(imagePart);
  console.log("Generated concepts:", adConcepts);

  const generationPromises = adConcepts.map(async (prompt) => {
    try {
      console.log(`Generating image for prompt: "${prompt}"`);
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
          return { src: imageUrl, prompt: prompt };
        }
      }
      throw new Error(`No image data found for prompt: ${prompt}`);
    } catch(e) {
      console.error(`Failed to generate image for prompt: "${prompt}"`, e);
      return null;
    }
  });

  const results = await Promise.all(generationPromises);
  
  const successfulResults = results.filter(result => result !== null) as AdImage[];
  
  if (successfulResults.length === 0) {
      throw new Error("All image generation attempts failed.");
  }
  
  return successfulResults;
};