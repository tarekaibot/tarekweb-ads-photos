import { GoogleGenAI, Modality, Type } from '@google/genai';
import { AdImage, AdIdea } from '../types';

// The user is expected to set up the API_KEY as an environment variable.
// Throwing an error here during initialization is good practice for developers.
if (!process.env.API_KEY) {
  throw new Error("The API_KEY environment variable is not set.");
}

// Initialize the GoogleGenAI client directly using the environment variable.
// This removes the need for a separate serverless function to fetch the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


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
const generateAdConcepts = async (imagePart: { inlineData: { data: string; mimeType: string; } }): Promise<AdIdea[]> => {
  const model = 'gemini-2.5-flash';
  const prompt = `
    بصفتك مدير إبداعي وخبير تسويق رقمي، قم بتحليل صورة المنتج هذه وابتكر 6 حملات إعلانية متكاملة ومختلفة.

    لكل حملة من الحملات الست، أريدك أن تقدم ثلاثة عناصر:
    1.  **عنوان (title):** عنوان جذاب يصف الحملة أو الجمهور المستهدف.
    2.  **نص إعلاني (description):** نص كامل ومقنع لمنشور على فيسبوك، يستهدف شريحة معينة من الجمهور (مثل الشباب، محبي الفخامة، الباحثين عن الراحة، إلخ). يجب أن تكون النصوص متنوعة ومبتكرة.
    3.  **وصف صورة (imagePrompt):** وصف مرئي ومفصل **لتوليد صورة إعلانية** لهذه الحملة. يجب أن يكون هذا الوصف مخصصًا لتوجيه نموذج توليد الصور، **ويجب ألا يحتوي على أي نص مكتوب**. ركز على تكوين الصورة، الألوان، الإضاءة، والمشاعر التي تثيرها. اجعل أوصاف الصور متنوعة جدًا (مثلاً: صورة للمنتج في بيئة طبيعية، صورة مقربة تبرز التفاصيل، صورة للمنتج أثناء الاستخدام في سياق حيوي، لقطة فنية تجريدية).

    الهدف هو الحصول على 6 أفكار إعلانية فريدة، كل فكرة لها نصها الإعلاني الخاص وصورتها المميزة التي لا تشبه الأخرى.

    **مهم جدًا:** أوصاف الصور (imagePrompt) يجب أن تكون باللغة العربية وتصف المشهد المرئي فقط، مع التأكيد على **عدم كتابة أي نصوص أو شعارات داخل الصورة**.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ideas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "عنوان جذاب يصف الحملة أو الجمهور المستهدف."
            },
            description: {
              type: Type.STRING,
              description: "النص الكامل للبوست الإعلاني الجاهز للنشر على فيسبوك."
            },
            imagePrompt: {
              type: Type.STRING,
              description: "وصف مرئي ومفصل لتوليد صورة إعلانية، مع التأكيد على عدم وجود أي نص في الصورة."
            }
          },
          required: ["title", "description", "imagePrompt"]
        },
        description: "قائمة من 6 حملات إعلانية متكاملة."
      }
    },
    required: ["ideas"]
  };
  
  try {
    const response = await ai.models.generateContent({
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
    return jsonResponse.ideas;
  } catch (error) {
      console.error("Error in generateAdConcepts:", error);
      throw new Error("فشل توليد النصوص الترويجية. قد تكون هناك مشكلة في الاتصال بالخدمة أو أن مفتاح API غير صالح.");
  }
};

/**
 * Step 2: Generate ad images based on the dynamically generated concepts.
 */
export const generateAdImages = async (productImage: File): Promise<{ images: AdImage[], ideas: AdIdea[] }> => {
  const imagePart = await fileToGenerativePart(productImage);

  console.log("Generating ad concepts...");
  const adIdeas = await generateAdConcepts(imagePart);
  console.log("Generated concepts:", adIdeas);

  const generationPromises = adIdeas.map(async (idea) => {
    try {
      const prompt = idea.imagePrompt; // Use the dedicated image prompt
      console.log(`Generating image for prompt: "${prompt}"`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      
      const candidate = response?.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            return { src: imageUrl, prompt: prompt };
          }
        }
      }
      
      // If we reach here, no image was found or the response was blocked.
      const finishReason = candidate?.finishReason;
      const safetyRatings = candidate?.safetyRatings;
      console.warn(`Image generation failed for prompt: "${prompt}". Reason: ${finishReason}`, { safetyRatings });
      throw new Error(`No image data found for prompt: ${prompt}`);

    } catch(e) {
      console.error(`Failed to generate image for prompt: "${idea.imagePrompt}"`, e);
      return null;
    }
  });

  const results = await Promise.all(generationPromises);
  
  const successfulResults = results.filter(result => result !== null) as AdImage[];
  
  if (successfulResults.length === 0) {
      throw new Error("فشل توليد جميع الصور. قد تكون هناك مشكلة في الخدمة أو أن المحتوى غير مسموح به. يرجى المحاولة مرة أخرى لاحقًا.");
  }
  
  return { images: successfulResults, ideas: adIdeas };
};