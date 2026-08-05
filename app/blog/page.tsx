'use client';

import { normalizeBlogPost, type BlogPost } from '@/lib/blog-type';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BlogPage() {
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
        .filter((post) => post.published === true);
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading posts...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Blog</h1>
          <div className="w-20 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Latest news, updates, and insights from Muaz Technology
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {posts.map((post: BlogPost) => (
              <article key={post.id} className="border-b border-gray-200 pb-16 last:border-b-0 last:pb-0">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  <div className="order-2 space-y-5 lg:order-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={16} className="text-blue-600" />
                      <span>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/blog/${post.id}`}
                        className="text-3xl font-bold text-gray-900 transition hover:text-blue-700 md:text-4xl"
                      >
                        {post.title}
                      </Link>
                      {post.subtitle ? (
                        <p className="mt-3 text-lg text-gray-600">{post.subtitle}</p>
                      ) : null}
                    </div>

                    <div className="space-y-4 text-base leading-8 text-gray-700">
                      {String(post.content ?? '')
                        .split('\n')
                        .map((paragraph: string) => paragraph.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((paragraph: string, index: number) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                    >
                      Continue reading
                    </Link>
                  </div>

                  <div className="order-1 lg:order-2">
                    {post.imageUrl ? (
                      <Link href={`/blog/${post.id}`} className="block overflow-hidden rounded-3xl bg-gray-100 shadow-lg">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="h-full max-h-[420px] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                        />
                      </Link>
                    ) : (
                      <div className="flex min-h-[280px] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-gray-100 text-blue-700">
                        <span className="text-sm font-semibold uppercase tracking-[0.3em]">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
