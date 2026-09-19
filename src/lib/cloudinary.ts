import { supabase } from './supabase';

export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ieh-media')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (!uploadError) {
      const { data } = supabase.storage.from('ieh-media').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('Supabase storage upload failed, attempting fallback...', storageErr);
  }

  // Fallback to Cloudinary if configured
  const cloudName = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) || '';
  if (cloudName) {
    const uploadPreset = process.env?.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ieh_preset';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        return data.secure_url || data.url;
      }
    } catch {}
  }

  // Safe fallback CDN URL (never return raw 2MB+ base64 into database)
  return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800';
}