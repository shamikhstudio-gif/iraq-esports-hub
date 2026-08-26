'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Image as ImageIcon, 
  Send, 
  Megaphone, 
  Sparkles, 
  Loader2, 
  Link2,
  Gamepad2
} from 'lucide-react';
import { SwordsIcon, TeamsIcon, MessagesIcon } from '@/components/icons/CustomIcons';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { CustomSelect } from './CustomSelect';
import { GameSearchSelect } from './GameSearchSelect';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'general' | 'scrim' | 'recruitment' | 'announcement'>('general');
  const [game, setGame] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const postTypeOptions = [
    { value: 'general', label: 'منشور عام (مشاركة تجارب أو أفكار)', icon: <MessagesIcon className="w-4 h-4 text-white" />, badge: 'عام' },
    { value: 'scrim', label: 'تحدي سكريم (مباريات تدريبية بين الفرق)', icon: <SwordsIcon className="w-4 h-4 text-white" />, badge: 'سكريم' },
    { value: 'recruitment', label: 'طلب لاعبين (بحث عن لاعبين LFP أو فرق LFT)', icon: <TeamsIcon className="w-4 h-4 text-white" />, badge: 'انضمام' },
    { value: 'announcement', label: 'إعلان رسمي (إعلانات المنظمات والبطولات)', icon: <Megaphone className="w-4 h-4 text-white" />, badge: 'رسمي' },
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...filesArray]);

      const previews = filesArray.map((file) => URL.createObjectURL(file));
      setMediaPreviews((prev) => [...prev, ...previews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsUploading(true);
    try {
      let uploadedUrls: string[] = [];

      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map((file) => uploadToCloudinary(file));
        uploadedUrls = await Promise.all(uploadPromises);
      }

      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      if (!savedUserId) {
        alert('يجب تسجيل الدخول لنشر منشور جديد');
        setIsUploading(false);
        return;
      }
      const authorId = savedUserId;

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          post_type: postType,
          game: game.trim() || null,
          media_urls: uploadedUrls,
          author_id: authorId,
          likes_count: 0,
          comments_count: 0,
        })
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      if (newPost) {
        onPostCreated(newPost as Post);
        setContent('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setGame('');
        onClose();
      }
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto no-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-animate max-w-lg w-full p-5 sm:p-6 rounded-2xl relative my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col text-white">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="font-black text-sm sm:text-base text-white">إنشاء منشور جديد في IEH</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <form id="create-post-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-3.5 pl-1 pr-0.5 text-right no-scrollbar">
          <CustomSelect
            label="نوع المنشور:"
            options={postTypeOptions}
            value={postType}
            onChange={(val) => setPostType(val as any)}
            className="w-full"
          />

          <div>
            <GameSearchSelect
              label="اللعبة المعنية:"
              mode="single"
              value={game}
              onChange={setGame}
              placeholder="ابحث عن لعبة المنشور أونلاين (مثل: Valorant, PUBG, CS2)..."
              showSuggestions={false}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">محتوى المنشور:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder={
                postType === 'scrim'
                  ? 'اكتب تفاصيل السكريم (الموعد، الخريطة، عدد الفرق، المستوى المطلوب)...'
                  : postType === 'recruitment'
                  ? 'اكتب متطلبات اللاعبين أو المراكز المطلوبة...'
                  : 'شارك ما يدور في ذهنك مع مجتمع الرياضات الإلكترونية العراقي...'
              }
              className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-white/15 h-20 group shadow-sm">
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 left-1 bg-black text-white border border-white/20 rounded-full p-1 opacity-90 hover:opacity-100 transition shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer transition border border-white/15 hover:border-white/30">
            <ImageIcon className="w-4 h-4 text-white" />
            <span>إرفاق صورة / بنر</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="create-post-form"
              disabled={isUploading || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-3d-primary text-black text-xs font-extrabold transition disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري النشر...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}