// components/BlogPostList.tsx
'use client';

import { normalizeBlogPost, type BlogPost } from '@/lib/blog-type';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type BlogPostListProps = {
  limit?: number;
  showViewAll?: boolean;
  variant?: 'grid' | 'list';
};

export default function BlogPostList({ 
  limit = 3, 
  showViewAll = true,
  variant = 'grid' 
}: BlogPostListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const blogRef = collection(db, 'blog');
    const q = query(blogRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs
        .map((doc) => normalizeBlogPost(doc.id, doc.data()))
        .filter((post) => post.published === true)
        .slice(0, limit);
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limit]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      {/* মোবাইলে শুধু ১টি পোস্ট (লেটেস্ট) */}
      <div className="block md:hidden">
        {posts.slice(0, 1).map((post) => (
          <BlogPostCard key={post.id} post={post} variant="list" />
        ))}
      </div>

      {/* ট্যাবলেট/ডেস্কটপে সব পোস্ট (গ্রিড ভিউ) */}
      <div className="hidden md:block">
        {variant === 'grid' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {variant === 'list' && (
          <div className="space-y-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} variant="list" />
            ))}
          </div>
        )}
      </div>

      {/* View All বাটন */}
      {showViewAll && posts.length > 0 && (
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
          >
            View All Blog Posts
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}

// BlogPostCard কম্পোনেন্ট
function BlogPostCard({ post, variant = 'grid' }: { post: BlogPost; variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <Link
        href={`/blog/${post.id}`}
        className="group flex flex-col md:flex-row gap-6 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
      >
        <div className="md:w-48 h-48 md:h-auto overflow-hidden bg-gray-100">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar size={14} className="text-blue-600" />
            <span>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition">
            {post.title}
          </h3>
          <p className="text-gray-600 line-clamp-2 mb-4">
            {post.subtitle || post.content?.slice(0, 100) || ''}
          </p>
          <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
            Read More <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    );
  }

  // Grid ভিউ (ডিফল্ট)
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
          Latest
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar size={14} className="text-blue-600" />
          <span>
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent'}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {post.subtitle || post.content?.slice(0, 100) || ''}
        </p>
        <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
          Read More <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}