import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { resend, generateVerificationEmailHtml } from '../lib/resend';
import { StreamChat } from 'stream-chat';
import { dispatchTestWebhook, sendDiscordWebhook } from '../lib/discordDispatcher';
import { Team } from '../lib/types';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://iwiufvpvvkkwmvaqohwz.supabase.co';

const serviceRoleKey =
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aXVmdnB2dmtrd212YXFvaHd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU4NTcyOCwiZXhwIjoyMTAzMTYxNzI4fQ.nNTEDoAiYrumluZg_UamtcA1_VdZiJSNNfhnP9HL_T0';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const api = new Hono();

// 1. Auth: Send Code
api.post('/auth/send-code', async (c) => {
  try {
    const { email, fullName } = await c.req.json();
    if (!email) {
      return c.json({ error: 'البريد الإلكتروني مطلوب' }, 400);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error: dbError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email: email.toLowerCase().trim(),
        code: code,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbError) {
      console.error('Database verification save error:', dbError);
    }

    try {
      const emailHtml = generateVerificationEmailHtml(code, fullName || 'اللاعب');
      await resend.emails.send({
        from: 'Babylon Network <onboarding@resend.dev>',
        to: [email],
        subject: `رمز تأكيد التسجيل في شبكة بابل: ${code}`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.warn('Resend exception:', emailErr);
    }

    return c.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح',
      demoCode: code,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'حدث خطأ أثناء إرسال كود التحقق' }, 500);
  }
});

// 2. Auth: Verify Code
api.post('/auth/verify-code', async (c) => {
  try {
    const { email, code, username, fullName, role, primaryGame, city } = await c.req.json();

    if (!email || !code) {
      return c.json({ error: 'البريد الإلكتروني وكود التحقق مطلوبان' }, 400);
    }

    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code.trim())
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError || !verification) {
      return c.json({ error: 'كود التحقق غير صحيح أو انتهت صلاحيته' }, 400);
    }

    await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    let profile = existingProfile;

    if (!existingProfile && username) {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: email.toLowerCase().trim(),
          username: username.trim(),
          full_name: fullName || username,
          role: role || 'player',
          primary_game: primaryGame || 'PUBG Mobile',
          city: city || 'بغداد',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          bio: 'لاعب مسجل في شبكة بابل للرياضات الإلكترونية',
          is_verified: false,
        })
        .select('*')
        .single();

      if (profileError) {
        return c.json({ error: 'فشل في إنشاء الحساب: ' + profileError.message }, 500);
      }
      profile = newProfile;
    }

    return c.json({
      success: true,
      message: 'تم تأكيد الحساب بنجاح',
      profile: profile || { email: email.toLowerCase().trim() },
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'حدث خطأ أثناء التحقق' }, 500);
  }
});

// 3. Games: Search
const NON_STEAM_ESPORTS = [
  { id: 'rocket-league', name: 'Rocket League', category: 'Sports / Action', year: '2015' },
  { id: 'fall-guys', name: 'Fall Guys', category: 'Party / Platformer', year: '2020' },
  { id: 'minecraft', name: 'Minecraft', category: 'Sandbox / Survival', year: '2011' },
  { id: 'genshin-impact', name: 'Genshin Impact', category: 'Action RPG', year: '2020' },
  { id: 'teamfight-tactics', name: 'Teamfight Tactics', category: 'Auto Battler', year: '2019' },
  { id: 'valorant', name: 'Valorant', category: 'Tactical Shooter', year: '2020' },
  { id: 'league-of-legends', name: 'League of Legends', category: 'MOBA', year: '2009' },
  { id: 'fortnite', name: 'Fortnite', category: 'Battle Royale', year: '2017' },
  { id: 'pubg-mobile', name: 'PUBG Mobile', category: 'Battle Royale', year: '2018' },
  { id: 'mobile-legends', name: 'Mobile Legends: Bang Bang', category: 'Mobile MOBA', year: '2016' },
  { id: 'brawl-stars', name: 'Brawl Stars', category: 'Mobile Action', year: '2018' },
  { id: 'free-fire', name: 'Free Fire', category: 'Mobile Battle Royale', year: '2017' },
];

api.get('/games/search', async (c) => {
  try {
    const query = (c.req.query('q') || '').trim();
    if (!query) {
      return c.json({ results: NON_STEAM_ESPORTS });
    }

    const cleanQuery = query.toLowerCase();
    const matchedNonSteam = NON_STEAM_ESPORTS.filter(g =>
      g.name.toLowerCase().includes(cleanQuery)
    );

    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(steamUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    let steamGames: any[] = [];
    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        steamGames = data.items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: 'لعبة PC',
          image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
          year: undefined,
        }));
      }
    }

    const steamGameNames = new Set(steamGames.map(g => g.name.toLowerCase()));
    const finalNonSteam = matchedNonSteam.filter(g => !steamGameNames.has(g.name.toLowerCase()));

    return c.json({
      results: [...finalNonSteam, ...steamGames].slice(0, 15),
      query: query,
    });
  } catch (error: any) {
    return c.json({ results: NON_STEAM_ESPORTS, error: error.message }, 200);
  }
});

// 4. Stream: Token
api.post('/stream/token', async (c) => {
  try {
    const API_KEY = process.env.GetStream_API || process.env.NEXT_PUBLIC_GETSTREAM_API || 'affyy642y3fs';
    const API_SECRET = process.env.GetStream_Secret || '9n8a86shyy4g7ywmfq9uzh46gaqt5862ezn55s39q6acvugnkts37b9ateadzxpu';

    if (!API_KEY || !API_SECRET) {
      console.error('[Stream Token] Missing credentials');
      return c.json({ error: 'Stream credentials are not configured.' }, 500);
    }

    const { userId, recipientId } = await c.req.json();
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.warn('[Stream Token] User profile not found in DB, using fallback:', userId);
    }

    const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);
    const token = serverClient.createToken(userId);

    try {
      await serverClient.upsertUser({
        id: userId,
        name: user?.full_name || user?.username || `Player_${userId.substring(0, 6)}`,
        image: user?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
      });

      // If recipientId is passed, also ensure recipient profile exists in Stream
      if (recipientId && recipientId !== userId) {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recipientId)
          .maybeSingle();

        if (recipientProfile) {
          await serverClient.upsertUser({
            id: recipientId,
            name: recipientProfile.full_name || recipientProfile.username || `Player_${recipientId.substring(0, 6)}`,
            image: recipientProfile.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
          });
        }
      }
    } catch (upsertErr) {
      console.warn('[Stream Token] Upsert user warning:', upsertErr);
    }

    return c.json({ token });
  } catch (error: any) {
    console.error('[Stream Token Error]:', error);
    return c.json({ error: error.message || 'Failed to generate token' }, 500);
  }
});

// 5. Support: Dispatch
api.post('/support/dispatch', async (c) => {
  try {
    const { userId, notificationId, type, subject, message } = await c.req.json();
    if (!userId || !message) {
      return c.json({ error: 'المعلومات غير مكتملة' }, 400);
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        notification_id: notificationId || null,
        type: type || 'suspension_appeal',
        subject: subject || 'استئناف تعليق حساب',
        message: message,
        status: 'open',
      })
      .select('*')
      .single();

    if (ticketError) {
      return c.json({ error: ticketError.message }, 500);
    }

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ support_dispatched: true })
        .eq('id', notificationId);
    }

    return c.json({
      success: true,
      ticket,
      message: 'تم إرسال طلب الدعم بنجاح',
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'حدث خطأ أثناء الإرسال' }, 500);
  }
});

// 6. Teams: Discord Webhook
api.post('/teams/discord-webhook', async (c) => {
  try {
    const body = await c.req.json();
    const { action, webhookUrl, channelName, mention, team, payload } = body;

    if (action === 'test') {
      if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        return c.json(
          { error: 'رابط Webhook غير صالح. يجب أن يبدأ بـ https://discord.com/api/webhooks/' },
          400
        );
      }

      const res = await dispatchTestWebhook(
        webhookUrl,
        channelName || '#discord',
        mention,
        (team as Team) || { name: 'فريق تجريبي', tag: 'TEST', city: 'بغداد' }
      );

      if (res.success) {
        return c.json({ success: true, message: 'تم إرسال الرسالة التجريبية إلى سيرفر الديسكورد بنجاح! 🎉' });
      } else {
        return c.json(
          { error: res.error || 'فشل إرسال الرسالة إلى ديسكورد. تأكد من صلاحيات الـ Webhook والقناة.' },
          (res.status as any) || 500
        );
      }
    }

    if (action === 'custom' && webhookUrl && payload) {
      const res = await sendDiscordWebhook(webhookUrl, payload);
      return c.json(res);
    }

    return c.json({ error: 'إجراء غير معروف' }, 400);
  } catch (err: any) {
    return c.json({ error: err.message || 'حدث خطأ في معالجة طلب الديسكورد' }, 500);
  }
});

// 7. Storage: Server-Side Media Upload with strict size and MIME validation
api.post('/upload/media', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];
    const userId = (body['userId'] as string) || 'public';
    const category = (body['category'] as string) || 'general';

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'لم يتم توفير ملف صالح للرفع' }, 400);
    }

    // Server-side strict payload guard: Reject > 2MB
    const MAX_SERVER_BYTES = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SERVER_BYTES) {
      return c.json(
        { error: 'حجم الملف يتجاوز الحد الأقصى المسموح به على الخادم (2 ميغابايت)' },
        413
      );
    }

    // Whitelist MIME types
    const ALLOWED_MIME = ['image/webp', 'image/jpeg', 'image/png'];
    if (!ALLOWED_MIME.includes(file.type)) {
      return c.json(
        { error: 'نوع الملف غير مدعوم. الأنواع المسموحة فقط: WebP, JPEG, PNG' },
        400
      );
    }

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const cleanBase = (file.name || 'asset').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    const fileName = `${cleanBase}_${Date.now()}.${ext}`;
    const filePath = `uploads/${category}/${userId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('ieh-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      return c.json({ error: 'فشل التخزين على الخادم: ' + uploadError.message }, 500);
    }

    const { data: publicData } = supabaseAdmin.storage.from('ieh-media').getPublicUrl(filePath);

    return c.json({
      success: true,
      url: publicData.publicUrl,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'حدث خطأ غير متوقع أثناء معالجة الرفع' }, 500);
  }
});

