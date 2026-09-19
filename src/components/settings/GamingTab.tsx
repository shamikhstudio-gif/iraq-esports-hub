import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { GAMES_LIST } from '@/lib/constants';
import { Button, Badge, Card } from '@/components/ui';

interface GamingTabProps {
  gamingData: {
    primaryGame: string;
    inGameId: string;
    inGameTag: string;
    inGameRole: string;
    discordTag: string;
    steamId: string;
  };
  setGamingData: React.Dispatch<React.SetStateAction<any>>;
  triggerChange: () => void;
}

export function GamingTab({
  gamingData,
  setGamingData,
  triggerChange,
}: GamingTabProps) {
  const games = GAMES_LIST.filter((g) => g.id !== 'all');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* In-Game Roles and Primary Titles */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-white" />
            <span>الهوية التنافسية والأدوار</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">تحديد لعبتك الأساسية ورتبتك وموقعك التكتيكي داخل الفريق.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">اللعبة الأساسية</label>
            <select
              value={gamingData.primaryGame}
              onChange={(e) => { setGamingData({ ...gamingData, primaryGame: e.target.value }); triggerChange(); }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-white/30"
            >
              {games.map((g) => (
                <option key={g.id} value={g.name} className="bg-black text-white">{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">الدور التكتيكي (In-Game Role)</label>
            <input 
              type="text" 
              value={gamingData.inGameRole}
              onChange={(e) => { setGamingData({ ...gamingData, inGameRole: e.target.value }); triggerChange(); }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
              placeholder="مثال: IGL, Sniper, Rusher, Support..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">معرف اللعبة الأساسي (In-Game ID / UID)</label>
            <input 
              type="text" 
              value={gamingData.inGameId}
              onChange={(e) => { setGamingData({ ...gamingData, inGameId: e.target.value }); triggerChange(); }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
              placeholder="مثال: 5123984124"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">اسم الحساب داخل اللعبة (In-Game Nickname)</label>
            <input 
              type="text" 
              value={gamingData.inGameTag}
              onChange={(e) => { setGamingData({ ...gamingData, inGameTag: e.target.value }); triggerChange(); }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
              placeholder="مثال: PLAYER#777"
            />
          </div>
        </div>
      </Card>

      {/* Connected Accounts / Integrations */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-white">ربط الحسابات ومنصات الجيمنج</h2>
          <p className="text-xs text-zinc-400 mt-1">اربط حساباتك الرسمية لتسهيل التواصل والتحقق أثناء مباريات السكريمات والبطولات.</p>
        </div>

        <div className="space-y-3">
          {/* Discord Account */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base">
                D
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-2">
                  <span>Discord</span>
                  <Badge variant="outline" size="xs">جاهز للربط</Badge>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">{gamingData.discordTag || 'لم يتم الربط بعد'}</div>
              </div>
            </div>
            <Button type="button" variant="outline" size="xs">
              ربط الحساب
            </Button>
          </div>

          {/* Steam Account */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base">
                S
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-2">
                  <span>Steam</span>
                  <Badge variant="outline" size="xs">جاهز للربط</Badge>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">{gamingData.steamId || 'لم يتم الربط بعد'}</div>
              </div>
            </div>
            <Button type="button" variant="outline" size="xs">
              ربط الحساب
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
