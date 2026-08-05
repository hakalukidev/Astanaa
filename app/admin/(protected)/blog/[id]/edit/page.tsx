import AdminShell from '@/components/admin/AdminShell';
import BlogPostEditor from '@/components/admin/BlogPostEditor';

type AdminEditBlogRouteProps = {
  params: {
    id: string;
  };
};

export default function AdminEditBlogRoute({
  params,
}: AdminEditBlogRouteProps) {
  return (
    <AdminShell>
      <BlogPostEditor mode="edit" postId={params.id} />
    </AdminShell>
  );
}

