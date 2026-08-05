import { db } from '@/lib/firebase';
import { normalizeBlogPost } from '@/lib/blog-type';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getBlogPost(id: string) {
  try {
    if (!db) {
      console.error('Firestore not initialized');
      return null;
    }
    const docRef = doc(db, 'blog', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return normalizeBlogPost(snapshot.id, snapshot.data());
  } catch (error) {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  if (!post || !post.published) {
    notFound();
  }

  return (
    <main className="bg-white min-h-screen py-12">
      <article className="container mx-auto px-4 max-w-4xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={18} /> Back to Blog
        </Link>

        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-96 object-cover rounded-xl mb-8" />
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        {post.subtitle && (
          <p className="text-xl text-gray-600 mb-6">{post.subtitle}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-4 border-b">
          <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(post.createdAt).toLocaleTimeString()}</span>
        </div>

        <div className="prose prose-lg max-w-none">
          {post.content
            .split('\n')
            .map((paragraph: string) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph: string, idx: number) => (
              <p key={idx} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>
            ))}
        </div>
      </article>
    </main>
  );
}
