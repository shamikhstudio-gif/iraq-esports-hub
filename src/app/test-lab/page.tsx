'use client';

import React, { useState } from 'react';
import { Button, Badge, Card, Icon } from '@/components/ui';
import Link from '@/lib/navigation';

export default function TestLabPage() {
  const [variant, setVariant] = useState<'rounded' | 'outlined'>('rounded');
  const [isFilled, setIsFilled] = useState(false);
  const [weight, setWeight] = useState<100 | 200 | 300 | 400 | 500 | 600 | 700>(400);
  const [iconSize, setIconSize] = useState<number>(24);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const iconCategories = [
    {
      title: 'الألعاب والقتال والتنافس (Gaming & Combat)',
      icons: [
        { name: 'sports_esports', label: 'يد تحكم' },
        { name: 'swords', label: 'سيوف اشتباك' },
        { name: 'stadia_controller', label: 'تحكم ألعاب' },
        { name: 'joystick', label: 'عصا ألعاب' },
        { name: 'videogame_asset', label: 'جهاز تحكم' },
        { name: 'military_tech', label: 'رتبة عسكرية' },
        { name: 'target', label: 'هدف وقنص' },
        { name: 'crosshairs', label: 'مؤشر تصويب' },
        { name: 'sports_kabaddi', label: 'مواجهة قتالية' },
        { name: 'skull', label: 'إقصاء / Kills' },
      ],
    },
    {
      title: 'الجوائز والتصنيفات والبطولات (Trophies & Ranks)',
      icons: [
        { name: 'emoji_events', label: 'كأس البطولة' },
        { name: 'award_star', label: 'وسام شرف' },
        { name: 'workspace_premium', label: 'شهادة ممتازة' },
        { name: 'crown', label: 'تاج الصدارة' },
        { name: 'star', label: 'نجمة تقييم' },
        { name: 'stars', label: 'نجوم ذهبية' },
        { name: 'local_fire_department', label: 'سلسلة انتصارات' },
        { name: 'leaderboard', label: 'لوحة الترتيب' },
        { name: 'diamond', label: 'رتبة دياموند' },
        { name: 'flare', label: 'توهج إنجاز' },
      ],
    },
    {
      title: 'الفرق والمجتمع والتواصل (Teams & Community)',
      icons: [
        { name: 'groups', label: 'فريق كامل' },
        { name: 'group_add', label: 'تجنيد لاعب' },
        { name: 'diversity_3', label: 'تحالف فرق' },
        { name: 'person', label: 'حساب لاعب' },
        { name: 'person_add', label: 'طلب انضمام' },
        { name: 'forum', label: 'غرفة دردشة' },
        { name: 'chat', label: 'رسالة سريعة' },
        { name: 'handshake', label: 'اتفاق وتحدي' },
        { name: 'share', label: 'مشاركة' },
        { name: 'mail', label: 'صندوق بريد' },
      ],
    },
    {
      title: 'الأمان وحالة السيرفر والإجراءات (System & Security)',
      icons: [
        { name: 'bolt', label: 'طاقة / سرعة' },
        { name: 'shield', label: 'حماية' },
        { name: 'verified_user', label: 'مستخدم موثق' },
        { name: 'verified', label: 'شارة توثيق' },
        { name: 'lock', label: 'غرفة مقفلة' },
        { name: 'lock_open', label: 'غرفة عامة' },
        { name: 'sensors', label: 'بث مباشر' },
        { name: 'radio_button_checked', label: 'نشط الآن' },
        { name: 'notifications', label: 'إشعارات' },
        { name: 'search', label: 'بحث سريع' },
        { name: 'tune', label: 'تخصيص' },
        { name: 'settings', label: 'إعدادات' },
        { name: 'refresh', label: 'تحديث' },
        { name: 'check_circle', label: 'تم بنجاح' },
        { name: 'cancel', label: 'إلغاء' },
        { name: 'warning', label: 'إنذار' },
        { name: 'delete', label: 'حذف' },
        { name: 'edit', label: 'تعديل' },
        { name: 'content_copy', label: 'نسخ المعرف' },
        { name: 'storefront', label: 'متجر eBits' },
      ],
    },
  ];

  const handleCopyCode = (iconName: string) => {
    const snippet = `<Icon name="${iconName}"${variant !== 'rounded' ? ` variant="${variant}"` : ''}${isFilled ? ' filled' : ''}${weight !== 400 ? ` weight={${weight}}` : ''} />`;
    navigator.clipboard.writeText(snippet);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" icon={<Icon name="science" size={14} filled />}>
                LAB // GOOGLE MATERIAL 3
              </Badge>
              <Badge variant="solid" size="xs">
                M3 Symbols
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>مختبر الأيقونات والتصميم — Google Material 3</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              نظام أيقونات Google Material Symbols الرسمي مع دعم الخط المتغير (Variable Font Settings: FILL, wght, GRAD, opsz) وبتنسيق أحادي 100% Monochrome.
            </p>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm" icon={<Icon name="arrow_back" size={16} />}>
              العودة للرئيسية
            </Button>
          </Link>
        </div>

        {/* Live Controls Console */}
        <Card className="p-5 sm:p-6 space-y-5 border-white/15">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Icon name="tune" size={20} className="text-white" />
              <h2 className="text-sm font-extrabold text-white">لوحة التحكم التفاعلية بالأيقونات</h2>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              fontVariationSettings: 'FILL' {isFilled ? 1 : 0}, 'wght' {weight}, 'opsz' 24
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Style Variant */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">نمط الحواف (Style)</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={variant === 'rounded' ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => setVariant('rounded')}
                  icon={<Icon name="rounded_corner" size={16} />}
                >
                  Rounded
                </Button>
                <Button
                  size="sm"
                  variant={variant === 'outlined' ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => setVariant('outlined')}
                  icon={<Icon name="crop_square" size={16} />}
                >
                  Outlined
                </Button>
              </div>
            </div>

            {/* Fill Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">حالة التعبئة (Fill Mode)</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!isFilled ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => setIsFilled(false)}
                >
                  Outlined (0)
                </Button>
                <Button
                  size="sm"
                  variant={isFilled ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => setIsFilled(true)}
                >
                  Solid Fill (1)
                </Button>
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">سماكة الخط (Weight: {weight})</label>
              <div className="grid grid-cols-4 gap-1">
                {([200, 300, 400, 600] as const).map((w) => (
                  <Button
                    key={w}
                    size="xs"
                    variant={weight === w ? 'primary' : 'secondary'}
                    onClick={() => setWeight(w)}
                  >
                    {w}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">الحجم البصري ({iconSize}px)</label>
              <div className="grid grid-cols-4 gap-1">
                {[18, 24, 32, 40].map((s) => (
                  <Button
                    key={s}
                    size="xs"
                    variant={iconSize === s ? 'primary' : 'secondary'}
                    onClick={() => setIconSize(s)}
                  >
                    {s}px
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Real-World Esports Components Showcase */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon name="dashboard" size={20} className="text-white" />
            <h2 className="text-base font-black text-white">معاينة واجهات الرياضات الإلكترونية الحية بـ Material 3</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Component 1: Scrim Lobby Card */}
            <Card className="p-5 space-y-4 border-white/20 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <Badge variant="live" icon={<Icon name="sensors" size={14} variant={variant} filled={isFilled} weight={weight} />}>
                  LIVE MATCH
                </Badge>
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Icon name="schedule" size={14} variant={variant} filled={isFilled} weight={weight} />
                  10:30 PM
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-black">
                    IEH
                  </div>
                  <div>
                    <div className="font-black text-sm text-white flex items-center gap-1">
                      <span>Baghdad Lions</span>
                      <Icon name="verified" size={14} filled className="text-white" />
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Icon name="sports_esports" size={13} variant={variant} filled={isFilled} weight={weight} />
                      Valorant 5v5
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Icon name="swords" size={22} variant={variant} filled={isFilled} weight={weight} className="text-white" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1">
                  <Icon name="emoji_events" size={16} variant={variant} filled={isFilled} weight={weight} />
                  جائزة: 500 eBits
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="group" size={16} variant={variant} filled={isFilled} weight={weight} />
                  4/5 جاهزون
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="sm"
                icon={<Icon name="login" size={16} variant={variant} filled={isFilled} weight={weight} />}
              >
                انضمام للمباراة
              </Button>
            </Card>

            {/* Component 2: Pro Player Profile Card */}
            <Card className="p-5 space-y-4 border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-black font-black flex items-center justify-center text-lg shadow-md">
                  SH
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>Shamikh_Pro</span>
                    <Icon name="verified" size={16} filled className="text-white" />
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Icon name="location_on" size={13} variant={variant} filled={isFilled} weight={weight} />
                      Baghdad
                    </span>
                    <span>•</span>
                    <span className="font-mono text-zinc-300">PUBG Mobile IGL</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white/[0.03] rounded-xl border border-white/10">
                <div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                    <Icon name="military_tech" size={14} variant={variant} filled={isFilled} weight={weight} />
                    المستوى
                  </div>
                  <div className="font-mono font-black text-sm text-white">LVL 48</div>
                </div>
                <div className="border-x border-white/10">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                    <Icon name="local_fire_department" size={14} variant={variant} filled={isFilled} weight={weight} />
                    الانتصارات
                  </div>
                  <div className="font-mono font-black text-sm text-white">12 STREAK</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                    <Icon name="bolt" size={14} variant={variant} filled={isFilled} weight={weight} />
                    eBits
                  </div>
                  <div className="font-mono font-black text-sm text-white">1,450</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={<Icon name="chat" size={16} variant={variant} filled={isFilled} weight={weight} />}
                >
                  محادثة
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  icon={<Icon name="group_add" size={16} variant={variant} filled={isFilled} weight={weight} />}
                >
                  دعوة لفريق
                </Button>
              </div>
            </Card>

            {/* Component 3: Tournament Bracket Preview */}
            <Card className="p-5 space-y-4 border-white/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Icon name="emoji_events" size={18} variant={variant} filled={isFilled} weight={weight} />
                    بطولة العراق الكبرى 2026
                  </span>
                  <Badge variant="solid" size="xs">
                    FINAL
                  </Badge>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  الجولة الختامية بين أفضل فريقين في العراق. يتم التحقق من جميع اللاعبين بالبصمة البيومترية ومصادقة مكافحة الغش.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Icon name="shield" size={16} variant={variant} filled={isFilled} weight={weight} />
                    نظام الحماية: مفعل
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="lock" size={16} variant={variant} filled={isFilled} weight={weight} />
                    سيرفر مشفر
                  </span>
                </div>

                <Button
                  variant="glow"
                  fullWidth
                  size="md"
                  icon={<Icon name="play_arrow" size={18} variant={variant} filled={isFilled} weight={weight} />}
                >
                  مشاهدة البث الرسمي
                </Button>
              </div>
            </Card>

          </div>
        </div>

        {/* Search & Icon Catalog */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Icon name="category" size={20} className="text-white" />
              <h2 className="text-base font-black text-white">كتالوج أيقونات Google Material 3 للرياضات الإلكترونية</h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Icon name="search" size={18} className="absolute right-3.5 top-2.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أيقونة بالاسم أو الوصف..."
                className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-2 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
              />
            </div>
          </div>

          {copiedIcon && (
            <div className="p-3 rounded-xl bg-white text-black text-xs font-extrabold text-center animate-in fade-in flex items-center justify-center gap-2">
              <Icon name="check" size={16} />
              <span>تم نسخ كود المكون للاستخدام المباشر: {`<Icon name="${copiedIcon}" />`}</span>
            </div>
          )}

          {/* Icon Categories */}
          <div className="space-y-8">
            {iconCategories.map((category) => {
              const filteredIcons = category.icons.filter(
                (i) =>
                  i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  i.label.includes(searchQuery)
              );

              if (filteredIcons.length === 0) return null;

              return (
                <div key={category.title} className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">
                    // {category.title}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {filteredIcons.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleCopyCode(item.name)}
                        className="p-3.5 rounded-2xl bg-[#090909] border border-white/10 hover:border-white/30 hover:bg-white/5 active:scale-[0.98] transition text-right group flex flex-col justify-between h-28 cursor-pointer"
                        title="اضغط لنسخ كود React"
                      >
                        <div className="flex items-start justify-between">
                          <Icon
                            name={item.name}
                            size={iconSize}
                            variant={variant}
                            filled={isFilled}
                            weight={weight}
                            className="text-white group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-300">
                            نسخ
                          </span>
                        </div>

                        <div>
                          <div className="font-mono text-xs font-bold text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {item.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
