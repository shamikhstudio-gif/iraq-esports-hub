import { Team, ScrimLobby, DiscordWebhookChannel } from '@/lib/types';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=IraqEsportsHub';
const DEFAULT_FOOTER_ICON = 'https://api.dicebear.com/7.x/bottts/svg?seed=IEH';

/**
 * Sends a Discord Webhook payload
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<{ success: boolean; status: number; error?: string }> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return { success: false, status: 400, error: 'رابط Webhook غير صالح' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      return { success: true, status: response.status };
    }

    const errorText = await response.text().catch(() => 'Unknown error');
    return { success: false, status: response.status, error: errorText };
  } catch (err: any) {
    console.error('Discord Webhook execution error:', err);
    return { success: false, status: 500, error: err.message || 'فشل الاتصال بسيرفر ديسكورد' };
  }
}

/**
 * Dispatches an event payload across all configured channels for a team that are subscribed to that event type
 */
export async function dispatchMultiChannelTeamEvent(
  team: Team,
  eventType: keyof DiscordWebhookChannel['events'],
  generatePayload: (channel: DiscordWebhookChannel) => DiscordWebhookPayload
): Promise<void> {
  const webhooks: DiscordWebhookChannel[] = team.discord_webhooks || [];
  if (!Array.isArray(webhooks) || webhooks.length === 0) return;

  const targetChannels = webhooks.filter(
    (ch) => ch.is_enabled !== false && ch.events?.[eventType] === true && ch.webhook_url
  );

  if (targetChannels.length === 0) return;

  await Promise.allSettled(
    targetChannels.map((channel) => {
      const payload = generatePayload(channel);
      return sendDiscordWebhook(channel.webhook_url, payload);
    })
  );
}

/**
 * 1. Test Webhook Channel
 */
export async function dispatchTestWebhook(
  webhookUrl: string,
  channelName: string,
  mention: string | undefined,
  team: Team
): Promise<{ success: boolean; status: number; error?: string }> {
  const payload: DiscordWebhookPayload = {
    username: `IEH • ${team.name} [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: mention ? `${mention}` : undefined,
    embeds: [
      {
        title: '🧪 رسالة تجريبية ناجحة من شبكة الرياضات الإلكترونية العراقية (IEH)',
        description: `تم التحقق من ربط القناة **${channelName || '#discord'}** بنجاح!\nسوف تستقبل هذه القناة الإشعارات والبطاقات الرسمية فور حدوثها في المنصة.`,
        color: 0xffffff,
        fields: [
          { name: '🛡️ الفريق', value: `${team.name} [${team.tag}]`, inline: true },
          { name: '📍 المحافظة', value: team.city || 'العراق', inline: true },
          { name: '🔥 التنبيهات المفعلة', value: 'جاهزة للإرسال التلقائي', inline: true },
        ],
        thumbnail: team.logo_url ? { url: team.logo_url } : undefined,
        footer: {
          text: 'Iraq Esports Hub • Automated Webhook Matrix',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return sendDiscordWebhook(webhookUrl, payload);
}

/**
 * 2. Scrim Challenge Created Broadcast
 */
export async function dispatchScrimCreatedDiscord(
  team: Team,
  lobby: ScrimLobby,
  originUrl = 'https://iraqesportshub.com'
): Promise<void> {
  return dispatchMultiChannelTeamEvent(team, 'scrim_created', (channel) => ({
    username: `IEH War Room • [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: channel.mention ? `${channel.mention}` : undefined,
    embeds: [
      {
        title: '⚔️ تحدي سكريم جديد في الساحة التنافسية!',
        description: `طرح فريق **${team.name} [${team.tag}]** تحدياً مفتوحاً للمواجهة في منصة IEH.`,
        url: `${originUrl}/scrims`,
        color: 0xffffff,
        fields: [
          { name: '🎮 اللعبة والنمط', value: `${lobby.game} • ${lobby.format}`, inline: true },
          { name: '🌐 سيرفر اللعب', value: lobby.server_region || 'Bahrain', inline: true },
          { name: '⏰ الموعد', value: new Date(lobby.scheduled_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }), inline: true },
          { name: '💬 الملاحظات', value: lobby.notes || 'تحدي مفتوح للفرق التنافسية', inline: false },
        ],
        thumbnail: team.logo_url ? { url: team.logo_url } : undefined,
        footer: {
          text: 'اضغط للدخول وقبول التحدي على IEH',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}

/**
 * 3. Match Completed & Official Victory Scorecard with Screenshot Proof
 */
export async function dispatchMatchCompletedDiscord(
  team: Team,
  opponentTeam: Team | null,
  lobby: ScrimLobby,
  ourScore: number,
  opponentScore: number,
  proofUrl?: string,
  originUrl = 'https://iraqesportshub.com'
): Promise<void> {
  const isWin = ourScore > opponentScore;
  const isDraw = ourScore === opponentScore;

  return dispatchMultiChannelTeamEvent(team, 'match_completed', (channel) => ({
    username: `IEH Referee • [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: channel.mention ? `${channel.mention}` : undefined,
    embeds: [
      {
        title: isWin
          ? `🏆 فوز رسمي موثق لـ ${team.name} [${team.tag}]!`
          : isDraw
          ? `🤝 تعادل رسمي لـ ${team.name} [${team.tag}]`
          : `⚔️ انتهاء المباراة لـ ${team.name} [${team.tag}]`,
        description: `تم اعتماد نتيجة المباراة رسمياً من لجنة التحكيم في شبكة الرياضات الإلكترونية العراقية.`,
        url: `${originUrl}/teams/${team.id}`,
        color: 0xffffff,
        fields: [
          { name: '🛡️ فريقنا', value: `**${team.name} [${team.tag}]**`, inline: true },
          { name: '⚔️ الخصم', value: `**${opponentTeam?.name || 'الخصم'} [${opponentTeam?.tag || 'IEH'}]**`, inline: true },
          {
            name: '📊 النتيجة الرسمية',
            value: `**${ourScore}** - **${opponentScore}** (${isWin ? 'فوز 👑' : isDraw ? 'تعادل' : 'خسارة'})`,
            inline: false,
          },
          { name: '🎮 اللعبة والنمط', value: `${lobby.game} (${lobby.format})`, inline: true },
          { name: '🗺️ الخريطة الرسمية', value: lobby.selected_map || 'الخريطة الرسمية', inline: true },
          { name: '🔥 سلسلة الانتصارات', value: `${team.current_streak || 1} انتصارات متتالية`, inline: true },
        ],
        image: (proofUrl || lobby.proof_url) ? { url: proofUrl || lobby.proof_url! } : undefined,
        thumbnail: opponentTeam?.logo_url ? { url: opponentTeam.logo_url } : team.logo_url ? { url: team.logo_url } : undefined,
        footer: {
          text: 'Iraq Esports Hub • سجل المباريات الموثق رسمياً',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}

/**
 * 4. War Room Ready / Match Call Panic Alert
 */
export async function dispatchWarRoomAlertDiscord(
  team: Team,
  opponentTeam: Team | null,
  lobby: ScrimLobby,
  originUrl = 'https://iraqesportshub.com'
): Promise<void> {
  return dispatchMultiChannelTeamEvent(team, 'war_room_alert', (channel) => ({
    username: `IEH War Room • [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: channel.mention ? `${channel.mention}` : undefined,
    embeds: [
      {
        title: '🚨 نداء عاجل: الخصم جاهز في غرفة المباراة والتحكيم!',
        description: `فريق **${opponentTeam?.name || 'الخصم'} [${opponentTeam?.tag || 'IEH'}]** جاهز للمواجهة الآن. يرجى من التشكيلة الدخول فوراً لبدء اللقاء.`,
        url: `${originUrl}/scrims`,
        color: 0xffffff,
        fields: [
          { name: '🎮 اللعبة', value: lobby.game, inline: true },
          { name: '🔑 بيانات الروم', value: lobby.room_code || 'راجع غرفة التحكيم على المنصة', inline: true },
          { name: '🎙️ روم الديسكورد', value: lobby.discord_channel ? `[دخول الصوتية](${lobby.discord_channel})` : 'غير محدد', inline: true },
        ],
        footer: {
          text: 'اضغط للدخول إلى غرفة المباراة والتحكيم',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}

/**
 * 5. Team Feed Post Mirroring
 */
export async function dispatchTeamPostDiscord(
  team: Team,
  postContent: string,
  authorName: string,
  postType: string,
  mediaUrl?: string,
  originUrl = 'https://iraqesportshub.com'
): Promise<void> {
  const typeLabel =
    postType === 'recruitment'
      ? '🎯 تجنيد وطلب انضمام'
      : postType === 'announcement'
      ? '📢 إعلان رسمي'
      : postType === 'scrim'
      ? '⚔️ طلب سكريم'
      : '💬 منشور عام';

  return dispatchMultiChannelTeamEvent(team, 'team_posts', (channel) => ({
    username: `IEH Feed • ${team.name} [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: channel.mention ? `${channel.mention}` : undefined,
    embeds: [
      {
        title: `📢 منشور رسمي جديد (${typeLabel})`,
        description: postContent,
        url: `${originUrl}/teams/${team.id}`,
        color: 0xffffff,
        fields: [
          { name: '✍️ الناشر', value: authorName, inline: true },
          { name: '🛡️ الفريق', value: `${team.name} [${team.tag}]`, inline: true },
        ],
        image: mediaUrl ? { url: mediaUrl } : undefined,
        thumbnail: team.logo_url ? { url: team.logo_url } : undefined,
        footer: {
          text: 'تم النشر عبر شبكة الرياضات الإلكترونية العراقية',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}

/**
 * 6. Roster Signing / Update Broadcast
 */
export async function dispatchRosterUpdateDiscord(
  team: Team,
  playerName: string,
  roleName: string,
  action: 'joined' | 'promoted' | 'left' = 'joined',
  originUrl = 'https://iraqesportshub.com'
): Promise<void> {
  return dispatchMultiChannelTeamEvent(team, 'roster_updates', (channel) => ({
    username: `IEH Roster • ${team.name} [${team.tag}]`,
    avatar_url: team.logo_url || DEFAULT_AVATAR,
    content: channel.mention ? `${channel.mention}` : undefined,
    embeds: [
      {
        title:
          action === 'joined'
            ? '✍️ إعلان تعاقد وانضمام لاعب جديد للتشكيلة!'
            : action === 'promoted'
            ? '⭐ ترقية رتبة لاعب في الفريق!'
            : '👋 مغادرة لاعب من التشكيلة',
        description:
          action === 'joined'
            ? `نرحب باللاعب **${playerName}** الذي انضم رسمياً إلى صفوف **${team.name} [${team.tag}]** بدور **${roleName}**.`
            : `تم تحديث سجلات التشكيلة للاعب **${playerName}**.`,
        url: `${originUrl}/teams/${team.id}`,
        color: 0xffffff,
        thumbnail: team.logo_url ? { url: team.logo_url } : undefined,
        footer: {
          text: 'Iraq Esports Hub • سوق الانتقالات والتشكيلات',
          icon_url: DEFAULT_FOOTER_ICON,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}
