'use client';

import React from 'react';
import { 
  Plus, 
  Pipette, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { TeamRole } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

const PRESET_COLORS = [
  '#ffffff',
  '#e4e4e7',
  '#d4d4d8',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#27272a',
];

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_roster', label: 'إدارة التشكيلة وتعيين الرتب' },
  { id: 'accept_requests', label: 'قبول ورفض طلبات الانضمام' },
  { id: 'kick_members', label: 'طرد واستبعاد الأعضاء' },
  { id: 'manage_scrims', label: 'تنظيم وتسجيل السكريمات والمباريات' },
  { id: 'manage_messages', label: 'الوصول إلى رسائل الفريق والرد عليها' },
  { id: 'edit_team', label: 'تعديل قوانين وبيانات الفريق' },
];

function isLightColor(color: string): boolean {
  if (!color || !color.startsWith('#')) return false;
  const c = color.substring(1);
  const rgb = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 160;
}

interface TeamRolesTabProps {
  roles: TeamRole[];
  isCreatingRole: boolean;
  setIsCreatingRole: (val: boolean) => void;
  newRoleName: string;
  setNewRoleName: (val: string) => void;
  newRoleColor: string;
  setNewRoleColor: (val: string) => void;
  newRolePermissions: string[];
  setNewRolePermissions: (val: string[]) => void;
  editingRoleId: string | null;
  setEditingRoleId: (val: string | null) => void;
  handleSaveRole: () => void;
  handleDeleteRole: (id: string) => void;
  isLoading: boolean;
}

export function TeamRolesTab({
  roles,
  isCreatingRole,
  setIsCreatingRole,
  newRoleName,
  setNewRoleName,
  newRoleColor,
  setNewRoleColor,
  newRolePermissions,
  setNewRolePermissions,
  editingRoleId,
  setEditingRoleId,
  handleSaveRole,
  handleDeleteRole,
  isLoading,
}: TeamRolesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white">
            رتب الفريق والصلاحيات (Discord-like Roles)
          </h3>
          <p className="text-[11px] text-zinc-400">
            أنشئ رتباً مخصصة مع شارات وحدد صلاحيات كل رتبة في الفريق
          </p>
        </div>
        {!isCreatingRole && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4 text-black" />}
            onClick={() => {
              setNewRoleName('');
              setNewRoleColor('#ffffff');
              setNewRolePermissions([]);
              setEditingRoleId(null);
              setIsCreatingRole(true);
            }}
          >
            <span>إنشاء رتبة جديدة</span>
          </Button>
        )}
      </div>

      {/* Create Role Form */}
      {isCreatingRole && (
        <Card variant="elevated" className="p-4 sm:p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">
              {editingRoleId ? 'تعديل الرتبة:' : 'تفاصيل الرتبة الجديدة:'}
            </h4>
            <button
              onClick={() => {
                setIsCreatingRole(false);
                setEditingRoleId(null);
              }}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الرتبة:</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="مثال: مدرب / Coach أو كابتن هجوم"
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">لون الشارة والرتبة:</label>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {/* 1. Custom Color Picker */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center relative cursor-pointer transition-all overflow-hidden ${
                    !PRESET_COLORS.includes(newRoleColor)
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-md border-0'
                      : 'bg-[#202020] hover:bg-[#2c2c2c] border border-white/30 hover:scale-105 shadow-xs'
                  }`}
                  style={!PRESET_COLORS.includes(newRoleColor) ? { backgroundColor: newRoleColor } : undefined}
                  title="تخصيص لون إضافي (Custom Color)"
                >
                  <Pipette 
                    className={`w-3.5 h-3.5 pointer-events-none transition-colors ${
                      !PRESET_COLORS.includes(newRoleColor)
                        ? isLightColor(newRoleColor)
                          ? 'text-black stroke-[2.5]'
                          : 'text-white stroke-[2.5]'
                        : 'text-zinc-200 stroke-[2]'
                    }`} 
                  />
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="اختر لوناً مخصصاً"
                  />
                </div>

                {/* 2. Preset Swatches */}
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewRoleColor(c)}
                    className={`w-7 h-7 rounded-lg shrink-0 transition-all ${
                      newRoleColor === c
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-md'
                        : 'hover:scale-105 border border-white/15'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">صلاحيات الرتبة:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const hasPerm = newRolePermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      hasPerm ? 'bg-white text-black font-extrabold shadow-xs' : 'bg-[#080808] border-white/10 text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasPerm}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRolePermissions([...newRolePermissions, perm.id]);
                        } else {
                          setNewRolePermissions(newRolePermissions.filter((p) => p !== perm.id));
                        }
                      }}
                      className="w-4 h-4 text-black rounded bg-transparent border-white/20 accent-black"
                    />
                    <span className="text-xs">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={handleSaveRole}
            >
              <span>{editingRoleId ? 'حفظ التعديلات' : 'حفظ وإنشاء الرتبة'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Roles List */}
      <div className="space-y-2.5">
        {roles.map((role) => (
          <Card
            key={role.id}
            variant="interactive"
            className="flex items-center justify-between p-3.5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30 shadow-sm"
                style={{ backgroundColor: role.color || '#ffffff' }}
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{role.name}</span>
                  <Badge size="xs" color={role.color || '#ffffff'}>
                    {role.name}
                  </Badge>
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5">
                  {role.permissions.length > 0
                    ? `الصلاحيات: ${role.permissions
                        .map((p) => AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label)
                        .filter(Boolean)
                        .join(' • ')}`
                    : 'لا توجد صلاحيات إدارية (رتبة شرفية / تشكيلة)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setNewRoleName(role.name);
                  setNewRoleColor(role.color);
                  setNewRolePermissions(role.permissions);
                  setEditingRoleId(role.id);
                  setIsCreatingRole(true);
                }}
                className="text-zinc-400 hover:text-white"
                title="تعديل الرتبة"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteRole(role.id)}
                className="text-zinc-400 hover:text-white"
                title="حذف الرتبة"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
