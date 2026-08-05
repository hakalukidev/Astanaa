'use client';

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Send,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type BlogPostInput } from '@/lib/blog-type';

const emptyFormData: BlogPostInput = {
  title: '',
  subtitle: '',
  content: '',
  imageUrl: '',
  published: true,
};

type BlogPostEditorProps = {
  mode: 'create' | 'edit';
  postId?: string;
};

export default function BlogPostEditor({
  mode,
  postId,
}: BlogPostEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(mode === 'edit');
  const [uploading, setUploading] = useState(false);
  const [previewSlug, setPreviewSlug] = useState('post-slug');
  const [previewImage, setPreviewImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BlogPostInput>(emptyFormData);

  const setField = <Key extends keyof BlogPostInput>(
    key: Key,
    value: BlogPostInput[Key]
  ) => {
    setFormData((currentData) => ({ ...currentData, [key]: value }));
  };

  useEffect(() => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    setPreviewSlug(slug || 'post-slug');
  }, [formData.title]);

  useEffect(() => {
    setPreviewImage(formData.imageUrl);
  }, [formData.imageUrl]);

  useEffect(() => {
    if (mode !== 'edit' || !postId) {
      return;
    }

    const loadPost = async () => {
      try {
        const response = await fetch(`/api/admin/blog/${postId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to load blog post.');
        }

        setFormData({
          content: data.content ?? '',
          imageUrl: data.imageUrl ?? '',
          published: Boolean(data.published),
          subtitle: data.subtitle ?? '',
          title: data.title ?? '',
        });
      } catch (error) {
        console.error(error);
        alert('Failed to load the blog post.');
        router.push('/admin/blog');
      } finally {
        setIsLoadingPost(false);
      }
    };

    void loadPost();
  }, [mode, postId, router]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const image = new Image();

        image.src = event.target?.result as string;
        image.onload = () => {
          const canvas = document.createElement('canvas');
          let width = image.width;
          let height = image.height;

          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }

          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');

          context?.drawImage(image, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed.'));
                return;
              }

              resolve(
                new File([blob], file.name, {
                  lastModified: Date.now(),
                  type: 'image/jpeg',
                })
              );
            },
            'image/jpeg',
            0.8
          );
        };
        image.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);
      const compressedFile = await compressImage(file);
      setUploadProgress(40);

      const uploadFormData = new FormData();
      uploadFormData.append('file', compressedFile);

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (progressEvent) => {
          if (!progressEvent.lengthComputable) {
            return;
          }

          const percent = 40 + (progressEvent.loaded / progressEvent.total) * 40;
          setUploadProgress(Math.round(percent));
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText) as { url: string });
            return;
          }

          reject(new Error('Upload failed.'));
        };

        xhr.onerror = () => reject(new Error('Network error.'));
        xhr.open('POST', '/api/admin/blog/upload');
        xhr.send(uploadFormData);
      });

      const data = await uploadPromise;

      setUploadProgress(100);
      setField('imageUrl', data.url);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error(error);
      alert('Failed to upload image.');
      setPreviewImage('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleSubmit(published: boolean) {
    if (!formData.title.trim()) {
      alert('Please add a title before saving.');
      return;
    }

    if (!formData.content.trim()) {
      alert('Please add content before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        mode === 'edit' ? `/api/admin/blog/${postId}` : '/api/admin/blog',
        {
          body: JSON.stringify({ ...formData, published }),
          headers: { 'Content-Type': 'application/json' },
          method: mode === 'edit' ? 'PUT' : 'POST',
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            `Failed to ${mode === 'edit' ? 'update' : 'save'} the post.`
        );
      }

      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the post.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const wordCount = useMemo(
    () => formData.content.trim().split(/\s+/).filter(Boolean).length,
    [formData.content]
  );
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const heading = mode === 'edit' ? 'Edit Post' : 'Create New Post';
  const description =
    mode === 'edit'
      ? 'Update the title, image, and content for this post.'
      : 'Write, edit, and publish blog content';
  const saveLabel = mode === 'edit' ? 'Update Post' : 'Publish Now';

  if (isLoadingPost) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog"
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-gray-500 transition-all duration-200"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {heading}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={(event) => setField('title', event.target.value)}
                  placeholder="Enter a clear, descriptive title..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={120}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">{formData.title.length}/120 characters</p>
                  {formData.title.length > 60 ? (
                    <p className="text-xs text-orange-500 flex items-center gap-1">
                      <AlertCircle size={12} /> SEO tip: Keep under 60 chars
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Subtitle / Excerpt
                </label>
                <input
                  value={formData.subtitle}
                  onChange={(event) => setField('subtitle', event.target.value)}
                  placeholder="Optional subtitle or short description..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                />
                <p className="text-xs text-gray-400 mt-2">{formData.subtitle.length}/160 characters</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Cover Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(event) => setField('imageUrl', event.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Uploading {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span className="text-sm">Upload</span>
                      </>
                    )}
                  </button>
                  {formData.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setField('imageUrl', '');
                        setPreviewImage('');
                      }}
                      className="inline-flex items-center justify-center border border-red-200 rounded-lg px-3 py-3 text-red-500 hover:bg-red-50 transition"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
              </div>

              {uploading && uploadProgress > 0 && uploadProgress < 100 ? (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl overflow-hidden bg-gray-100 min-h-[200px] flex items-center justify-center border border-gray-200">
                {previewImage || formData.imageUrl ? (
                  <img
                    src={previewImage || formData.imageUrl}
                    alt="Cover preview"
                    className="w-full h-auto max-h-[260px] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <ImageIcon size={32} className="text-gray-300" />
                    <p className="text-sm text-gray-400">Image preview will appear here</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Recommended: 1200x630px. Max 10MB. Auto-compressed to 80% quality.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Content <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><FileText size={12} /> {wordCount} words</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {readTime} min read</span>
                </div>
              </div>

              <textarea
                value={formData.content}
                onChange={(event) => setField('content', event.target.value)}
                rows={16}
                placeholder="Write your post content here..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />

              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-400">
                  Paragraph breaks are preserved on the site.
                </p>
                <p className="text-xs text-gray-400">{formData.content.length.toLocaleString()} characters</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Send size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Publish</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Publish immediately</p>
                      <p className="text-xs text-gray-400">Make live on save</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(event) => setField('published', event.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void handleSubmit(false)}
                      disabled={isSaving}
                      className="w-full border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSubmit(true)}
                      disabled={isSaving}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          {saveLabel}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Eye size={16} className="text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">SEO Preview</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-blue-600 font-medium text-base line-clamp-1">{formData.title || 'Post title goes here'}</p>
                  <p className="text-xs text-gray-400 mt-1">muazbd.net/blog/{previewSlug}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {formData.subtitle || formData.content.slice(0, 120) || 'Subtitle or excerpt...'}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString()}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {readTime} min read</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Quick Tips</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Keep titles under 60 characters.</li>
                  <li>Use 1200x630px cover images.</li>
                  <li>Write enough detail to be useful for readers.</li>
                  <li>Use short paragraphs for easier reading.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
