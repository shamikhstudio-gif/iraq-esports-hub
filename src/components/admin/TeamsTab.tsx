'use client';

import React from 'react';
import { Team } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface TeamsTabProps {
  teams: Team[];
  onToggleTeamVerify: (team: Team) => void;
}

export function TeamsTab({ teams, onToggleTeamVerify }: TeamsTabProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#080808] text-zinc-400 font-bold border-b border-white/10">
            <tr>
              <th className="p-3.5">الفريق / المنظمة</th>
              <th className="p-3.5">المقر والألعاب</th>
              <th className="p-3.5">حالة التوثيق</th>
              <th className="p-3.5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                      alt={t.name}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {t.name}
                        <span className="font-mono text-zinc-400">[{t.tag}]</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">{t.bio}</div>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="text-white font-bold">{t.city}</div>
                  <div className="text-[10px] text-zinc-400">{t.games?.join(' • ')}</div>
                </td>

                <td className="p-3.5">
                  {t.is_verified ? (
                    <Badge variant="solid" size="xs">
                      موثق رسمياً
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="xs">
                      غير موثق
                    </Badge>
                  )}
                </td>

                <td className="p-3.5 text-center">
                  <Button
                    size="xs"
                    variant={t.is_verified ? 'secondary' : 'primary'}
                    onClick={() => onToggleTeamVerify(t)}
                  >
                    {t.is_verified ? 'إلغاء التوثيق' : 'توثيق رسمي'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
