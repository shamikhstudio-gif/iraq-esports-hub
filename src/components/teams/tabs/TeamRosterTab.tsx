'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Team, TeamMember, TeamRole } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface TeamRosterTabProps {
  team: Team;
  members: TeamMember[];
  roles: TeamRole[];
  handleUpdateMember: (
    memberId: string,
    roleId: string | null,
    title: string,
    isStarter: boolean
  ) => void;
  handleKickMember: (member: TeamMember) => void;
}

export function TeamRosterTab({
  team,
  members,
  roles,
  handleUpdateMember,
  handleKickMember,
}: TeamRosterTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white">
            التشكيلة الرسمية والرتب الممنوحة ({members.length} عضو)
          </h3>
          <p className="text-[11px] text-zinc-400">
            عين الرتب، مراكز اللعب (IGL, Sniper, Entry Fragger)، واللاعبين الأساسيين والاحتياط
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {members.map((member) => (
          <Card
            key={member.id}
            variant="elevated"
            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={member.user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100'}
                alt={member.user?.full_name || ''}
                className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-sm"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{member.user?.full_name}</span>
                  <span className="text-[11px] text-zinc-400 font-normal">@{member.user?.username}</span>
                  {member.role && (
                    <Badge size="xs" color={member.role.color || '#ffffff'}>
                      {member.role.name}
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 font-medium mt-0.5 flex items-center gap-2">
                  <span>المركز: {member.in_game_title || 'لاعب'}</span>
                  <span>•</span>
                  <span className={member.is_starter ? 'text-white font-bold' : 'text-zinc-500'}>
                    {member.is_starter ? 'أساسي (Starter)' : 'بديل (Bench)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Action Controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Role Select */}
              <select
                value={member.role_id || ''}
                onChange={(e) =>
                  handleUpdateMember(
                    member.id,
                    e.target.value || null,
                    member.in_game_title,
                    member.is_starter
                  )
                }
                className="text-xs p-2 rounded-xl input-3d font-bold text-white outline-none"
              >
                <option value="">-- بدون رتبة --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Position Title Input */}
              <input
                type="text"
                defaultValue={member.in_game_title}
                onBlur={(e) =>
                  handleUpdateMember(
                    member.id,
                    member.role_id || null,
                    e.target.value,
                    member.is_starter
                  )
                }
                placeholder="المركز (IGL, Sniper...)"
                className="w-28 text-xs p-2 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
              />

              {/* Starter Toggle */}
              <Button
                variant={member.is_starter ? 'primary' : 'secondary'}
                size="sm"
                onClick={() =>
                  handleUpdateMember(
                    member.id,
                    member.role_id || null,
                    member.in_game_title,
                    !member.is_starter
                  )
                }
                title="تبديل أساسي / احتياط"
              >
                <span>{member.is_starter ? 'أساسي' : 'بديل'}</span>
              </Button>

              {/* Kick Member */}
              {member.user_id !== team.captain_id && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleKickMember(member)}
                  className="text-zinc-400 hover:text-white"
                  title="طرد واستبعاد من الفريق"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
