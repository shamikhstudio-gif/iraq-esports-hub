import React from 'react';
import { Trash2 } from 'lucide-react';
import { Post } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface PostsTabProps {
  posts: Post[];
  onDeletePost: (postId: string) => void;
}

export function PostsTab({ posts, onDeletePost }: PostsTabProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
            <tr>
              <th className="p-3.5">الناشر</th>
              <th className="p-3.5">المحتوى والنوع</th>
              <th className="p-3.5">التفاعل</th>
              <th className="p-3.5 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition">
                <td className="p-3.5 font-bold text-white">
                  {p.author?.full_name || 'مستخدم'}
                </td>
                <td className="p-3.5">
                  <div className="text-zinc-300 line-clamp-1 max-w-md">{p.content}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" size="xs">{p.post_type}</Badge>
                    <Badge variant="default" size="xs">{p.game}</Badge>
                  </div>
                </td>
                <td className="p-3.5 text-zinc-400 font-mono">
                  {p.likes_count} إعجاب • {p.comments_count} رد
                </td>
                <td className="p-3.5 text-center">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onDeletePost(p.id)}
                    className="text-zinc-400 hover:text-white hover:bg-white/10"
                    title="حذف المنشور"
                    icon={<Trash2 className="w-4 h-4" />}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
