import * as FileSystem from 'expo-file-system';

const IMAGE_CACHE_DIR = FileSystem.cacheDirectory + 'image-cache/';

// Ensure the cache directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
};

// Simple string hashing function
const simpleHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return '0';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Generate a unique filename for the cached image
const getImageFilename = (url: string): string => {
  const hash = simpleHash(url);
  const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
  return `${IMAGE_CACHE_DIR}${hash}.${['jpg', 'jpeg', 'png', 'gif'].includes(extension) ? extension : 'jpg'}`;
};

// Check if the image exists in cache
const getCachedImage = async (url: string): Promise<string | null> => {
  try {
    await ensureDirExists();
    const filename = getImageFilename(url);
    const fileInfo = await FileSystem.getInfoAsync(filename);
    
    if (fileInfo.exists) {
      return filename;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached image:', error);
    return null;
  }
};

// Download and cache the image
const downloadAndCacheImage = async (url: string): Promise<string> => {
  try {
    const filename = getImageFilename(url);
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      filename,
      {}
    );

    const result = await downloadResumable.downloadAsync();
    return result?.uri || url;
  } catch (error) {
    console.error('Error downloading image:', error);
    return url; // Return original URL if download fails
  }
};

// Get image, either from cache or download it
const getCachedImageUri = async (url: string): Promise<string> => {
  if (!url) return '';
  
  try {
    // First try to get from cache
    const cachedImage = await getCachedImage(url);
    if (cachedImage) {
      return cachedImage;
    }
    
    // If not in cache, download and cache it
    return await downloadAndCacheImage(url);
  } catch (error) {
    console.error('Error in getCachedImageUri:', error);
    return url; // Fallback to original URL
  }
};

// Invalidate a specific cached image
export const invalidateCachedImage = async (url: string): Promise<void> => {
  if (!url) return;
  
  try {
    const filename = getImageFilename(url);
    const fileInfo = await FileSystem.getInfoAsync(filename);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filename, { idempotent: true });
      console.log('Invalidated cache for:', url);
    }
  } catch (error) {
    console.error('Error invalidating cached image:', error);
  }
};

// Clear the entire image cache
export const clearImageCache = async (): Promise<void> => {
  try {
    await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    await ensureDirExists();
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
};

export default getCachedImageUri;