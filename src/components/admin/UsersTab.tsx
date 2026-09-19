'use client';

import React from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Profile } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface UsersTabProps {
  users: Profile[];
  search: string;
  setSearch: (val: string) => void;
  onSuspendClick: (user: Profile) => void;
  onUnsuspend: (userId: string) => void;
  onWarn: (user: Profile) => void;
  onToggleVerify: (user: Profile) => void;
}

export function UsersTab({
  users,
  search,
  setSearch,
  onSuspendClick,
  onUnsuspend,
  onWarn,
  onToggleVerify,
}: UsersTabProps) {
  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو اسم المستخدم..."
            className="w-full text-xs p-2 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
            <tr>
              <th className="p-3.5">اللاعب / الحساب</th>
              <th className="p-3.5">اللعبة والمحافظة</th>
              <th className="p-3.5">حالة الحساب</th>
              <th className="p-3.5">الإنذارات</th>
              <th className="p-3.5 text-center">الإجراءات الإدارية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                      alt={u.full_name}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0 aspect-square"
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {u.full_name}
                        {u.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="text-[11px] text-zinc-400">@{u.username} • {u.email}</div>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="text-white font-bold">{u.primary_game}</div>
                  <div className="text-[11px] text-zinc-400">{u.city}</div>
                </td>

                <td className="p-3.5">
                  {u.is_suspended ? (
                    <Badge variant="outline" size="xs">
                      معلق مؤقتاً ({u.suspension_reason || 'مخالفة'})
                    </Badge>
                  ) : u.is_banned ? (
                    <Badge variant="outline" size="xs" className="border-white/40 text-white">
                      محظور نهائياً
                    </Badge>
                  ) : (
                    <Badge variant="solid" size="xs">
                      نشط وطبيعي
                    </Badge>
                  )}
                </td>

                <td className="p-3.5">
                  <Badge 
                    variant={(u.warning_count || 0) > 0 ? 'outline' : 'default'} 
                    size="xs"
                    className={(u.warning_count || 0) > 0 ? 'border-white/30 text-white font-bold' : ''}
                  >
                    {u.warning_count || 0} إنذارات
                  </Badge>
                </td>

                <td className="p-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    {u.is_suspended ? (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => onUnsuspend(u.id)}
                      >
                        فك التعليق
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onSuspendClick(u)}
                      >
                        تعليق الحساب
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => onWarn(u)}
                    >
                      {u.warning_count ? `إنذار #${u.warning_count + 1}` : 'إصدار إنذار'}
                    </Button>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onToggleVerify(u)}
                      title="توثيق / إلغاء التوثيق"
                      icon={<CheckCircle2 className={`w-4 h-4 ${u.is_verified ? 'text-white' : 'text-zinc-600'}`} />}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
