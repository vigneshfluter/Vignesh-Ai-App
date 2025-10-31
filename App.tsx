
import React, { useState, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      setOriginalFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setEditedImageUrl(null);
      setError(null);
    }
  };

  const handleEnhanceClick = useCallback(async () => {
    if (!originalFile || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const { base64, mimeType } = await fileToBase64(originalFile);
      const editedBase64 = await editImageWithGemini(base64, mimeType, prompt);
      
      if (editedBase64) {
        setEditedImageUrl(`data:image/png;base64,${editedBase64}`);
      } else {
        throw new Error('The API did not return an image. Please try a different prompt.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Enhancement failed:', errorMessage);
      setError(`Failed to enhance image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, prompt]);
  
  const isButtonDisabled = !originalFile || !prompt || isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Gemini Image Enhancer
        </h1>
        <p className="mt-2 text-lg text-gray-400">Upload an image and tell the AI how to edit it.</p>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Section */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col gap-6 h-full">
            <div>
              <label htmlFor="image-upload" className="block text-lg font-semibold mb-2 text-gray-300">
                1. Upload Your Image
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-500">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-purple-500 px-2">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-gray-300">
                2. Describe Your Edit
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-500"
                placeholder="e.g., 'Add a futuristic city in the background' or 'Change the color of the car to vibrant red'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleEnhanceClick}
              disabled={isButtonDisabled}
              className={`w-full py-3 px-4 font-bold text-lg rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105
                ${isButtonDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                }`}
            >
              {isLoading ? 'Enhancing...' : 'Enhance Image'}
            </button>
          </div>

          {/* Image Display Section */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[300px] lg:min-h-0">
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {isLoading && <Loader />}
            
            {!isLoading && !editedImageUrl && originalImageUrl && (
               <div className="w-full text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-300">Original Image</h3>
                <img src={originalImageUrl} alt="Original Upload" className="max-w-full max-h-96 rounded-lg mx-auto" />
              </div>
            )}
            
            {!isLoading && editedImageUrl && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4 text-gray-300">Original</h3>
                  <img src={originalImageUrl!} alt="Original Upload" className="max-w-full rounded-lg mx-auto" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Enhanced</h3>
                  <img src={editedImageUrl} alt="Edited" className="max-w-full rounded-lg mx-auto" />
                </div>
              </div>
            )}

            {!isLoading && !originalImageUrl && !error && (
                <div className="text-center text-gray-500">
                    <p className="text-lg">Your enhanced image will appear here.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
