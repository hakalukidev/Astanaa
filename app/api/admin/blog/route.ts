import { normalizeBlogPost } from '@/lib/blog-type';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// GET - Fetch all blog posts
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      );
    }

    const blogRef = collection(db, 'blog');
    const q = query(blogRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) =>
      normalizeBlogPost(doc.id, doc.data())
    );
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const timestamp = new Date().toISOString();

    const title = typeof body?.title === 'string' ? body.title : '';
    const slug = slugify(title);

    // If title is empty or slug ends up empty, fallback to a safe slug.
    const id = slug || new Date().toISOString().replace(/[^0-9a-z]/gi, '');

    const docRef = doc(db, 'blog', id);

    await setDoc(
      docRef,
      {
        ...body,
        createdAt: timestamp,
        updatedAt: timestamp,
        // ensure stored id matches
        // (id is also docRef.id)
      },
      { merge: false }
    );

    return NextResponse.json(
      normalizeBlogPost(id, {
        ...body,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

