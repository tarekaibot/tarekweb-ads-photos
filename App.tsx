import React, { useState, useCallback } from 'react';
import { AdImage } from './types';
import { generateAdImages } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ImageCard from './components/ImageCard';
import LoadingSpinner from './components/LoadingSpinner';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAdImages([]);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const images = await generateAdImages(file);
      setAdImages(images);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const resetState = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setAdImages([]);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-all duration-300">
      <header className="w-full max-w-5xl text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8 text-cyan-400"/>
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            طارق ويب لتوليد الصور الاعلانية
          </h1>
        </div>
        <p className="text-lg text-gray-400">
          ارفع صورة منتجك واحصل على 6 صور إعلانية مبتكرة فوراً
        </p>
      </header>

      <main className="w-full max-w-5xl flex-grow">
        {!imageFile ? (
          <ImageUploader onImageUpload={handleImageUpload} />
        ) : (
          <div className="flex flex-col items-center">
            {imagePreviewUrl && (
              <div className="mb-6 w-full max-w-sm">
                <img src={imagePreviewUrl} alt="معاينة المنتج" className="rounded-xl shadow-2xl shadow-cyan-500/20 object-contain mx-auto max-h-64"/>
              </div>
            )}
            
            {isLoading && (
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-cyan-300">جاري تحليل المنتج وتوليد الصور الإعلانية...</p>
                </div>
            )}

            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            {adImages.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6 animate-fade-in">
                        {adImages.map((image, index) => (
                            <ImageCard key={index} src={image.src} prompt={image.prompt} />
                        ))}
                    </div>
                    <button 
                      onClick={resetState} 
                      className="mt-10 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75">
                        تجربة منتج آخر
                    </button>
                </>
            )}
          </div>
        )}
      </main>

       <footer className="w-full max-w-5xl text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-gray-500">
          مدعوم بواسطة Gemini API
        </p>
      </footer>
    </div>
  );
};

export default App;