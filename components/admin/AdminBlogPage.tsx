'use client';

import { BlogPost, normalizeBlogPost } from '@/lib/blog-type';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const blogRef = collection(db, 'blog');
    const q = query(blogRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) =>
        normalizeBlogPost(doc.id, doc.data())
      );
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // ✅ handleDelete আপডেট করুন (onSnapshot অটো আপডেট করবে)
  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) {
      return;
    }

    setDeletingPostId(id);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to delete post.');
      }

      // setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete the post.');
    } finally {
      setDeletingPostId(null);
    }
  }

  const filtered = posts.filter((post) => {
    const normalizedSearch = search.toLowerCase();
    const matchSearch =
      post.title.toLowerCase().includes(normalizedSearch) ||
      post.subtitle.toLowerCase().includes(normalizedSearch);
    const matchFilter =
      filter === 'all' || (filter === 'published' ? post.published : !post.published);

    return matchSearch && matchFilter;
  });

  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText size={20} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Manager</h1>
            </div>
            <p className="text-sm text-gray-500 ml-14">Manage, edit, and publish your blog content from one place.</p>
          </div>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={18} />
            <span>New Post</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Total Posts</p>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
            <p className="text-xs text-gray-400 mt-1">All time content</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{published}</p>
            <p className="text-xs text-gray-400 mt-1">Live on website</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{drafts}</p>
            <p className="text-xs text-gray-400 mt-1">Not yet published</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or subtitle..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All posts</option>
                <option value="published">Published only</option>
                <option value="draft">Drafts only</option>
              </select>
            </div>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="sm:hidden flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white"
            >
              <Filter size={16} />
              {filter === 'all' ? 'All posts' : filter === 'published' ? 'Published' : 'Drafts'}
            </button>
          </div>

          {mobileFilterOpen ? (
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilter('all');
                    setMobileFilterOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  All posts
                </button>
                <button
                  onClick={() => {
                    setFilter('published');
                    setMobileFilterOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => {
                    setFilter('draft');
                    setMobileFilterOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Drafts
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{filtered.length}</span> of{' '}
            <span className="font-medium text-gray-900">{posts.length}</span> posts
            {search ? <span className="ml-1">matching "<span className="text-blue-600">{search}</span>"</span> : null}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-3">No posts found</p>
            <p className="text-sm text-gray-400 mb-4">
              {search ? 'Try adjusting your search or filter' : 'Get started by creating your first post'}
            </p>
            {!search && filter === 'all' ? (
              <Link href="/admin/blog/new" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Plus size={14} /> Create new post
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => {
              const isDeleting = deletingPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-4 sm:p-5 group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-28 sm:h-28 shrink-0">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-32 sm:h-28 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-28 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <FileText size={28} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          post.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {post.published ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                        {post.title}
                      </h3>

                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {post.subtitle}
                      </p>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/${post.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1"
                        >
                          <Eye size={14} /> View
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <button
                          onClick={() => void handleDelete(post.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition px-2 py-1 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
