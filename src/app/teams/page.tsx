'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, CheckCircle2, Search, Plus, Filter } from 'lucide-react';
import { TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team } from '@/lib/types';
import { CreateTeamModal } from '@/components/CreateTeamModal';
import { CustomSelect, SelectOption } from '@/components/CustomSelect';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTeams(data as Team[]);
    }
    setIsLoading(false);
  };

  const handleTeamCreated = (newTeam: Team) => {
    setTeams((prev) => [newTeam, ...prev]);
  };

  const filteredTeams = teams.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.tag.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === 'all' || t.city === cityFilter;
    return matchSearch && matchCity;
  });

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <TeamsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              الفرق والمنظمات العراقية (eSports Teams)
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              دليل الفرق والكلانات الرسمية في جمهورية العراق عبر مختلف الألعاب
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>تسجيل وتأسيس فريق جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الفريق أو التاغ (مثال: ذئاب بغداد، BWL)..."
            className="w-full text-xs p-2.5 pr-10 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <CustomSelect
            value={cityFilter}
            onChange={setCityFilter}
            options={[
              { value: 'all', label: 'جميع المحافظات العراقية' },
              { value: 'بغداد', label: 'بغداد' },
              { value: 'بابل', label: 'بابل' },
              { value: 'أربيل', label: 'أربيل' },
              { value: 'البصرة', label: 'البصرة' },
              { value: 'السليمانية', label: 'السليمانية' },
              { value: 'الموصل', label: 'الموصل' },
              { value: 'النجف', label: 'النجف' },
              { value: 'كربلاء', label: 'كربلاء' },
              { value: 'كركوك', label: 'كركوك' },
              { value: 'دهوك', label: 'دهوك' },
              { value: 'الأنبار', label: 'الأنبار' },
              { value: 'ذي قار', label: 'ذي قار' },
            ]}
            icon={<MapPin className="w-4 h-4 text-zinc-400" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card-3d p-12 text-center text-zinc-400 text-xs font-medium">
          جاري تحميل الفرق...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="card-3d p-12 text-center text-zinc-400">
          <TeamsIcon className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="font-bold text-sm text-zinc-200">لا توجد فرق مطابقة</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => (
            <div key={team.id} className="card-3d overflow-hidden group flex flex-col justify-between text-white">
              <div className="h-28 relative bg-[#050505]">
                <img
                  src={team.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'}
                  alt={team.name}
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/90 backdrop-blur text-white text-[10px] font-extrabold border border-white/15 shadow-sm">
                  [{team.tag}]
                </span>
              </div>

              <div className="p-4 pt-0 relative flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-end justify-between -mt-8 mb-3">
                    <img
                      src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                      alt={team.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.8)] bg-black"
                    />
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {team.city}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:underline transition flex items-center gap-1.5 mb-1.5">
                    {team.name}
                    {team.is_verified && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-3 line-clamp-2 font-normal">
                    {team.bio || 'فريق عراقي منافس في بطولات الرياضات الإلكترونية.'}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    {team.is_exclusive && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/15 text-white border border-white/25">
                        حصرية
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                        team.recruitment_status === 'open'
                          ? 'bg-white text-black shadow-xs'
                          : team.recruitment_status === 'invite_only'
                          ? 'bg-white/15 text-zinc-300 border border-white/20'
                          : 'bg-[#080808] text-zinc-500 border border-white/10'
                      }`}
                    >
                      {team.recruitment_status === 'open'
                        ? 'تجارب مفتوحة'
                        : team.recruitment_status === 'invite_only'
                        ? 'بالدعوة'
                        : 'مغلق'}
                    </span>
                    {team.games?.map((g, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#080808] text-zinc-300 border border-white/10"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/teams/${team.id}`}
                  className="w-full py-2 btn-3d-dark text-white rounded-xl text-xs font-bold text-center transition block shadow-sm hover:border-white/30"
                >
                  عرض ملف الفريق والتشكيلة والرتب
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
}