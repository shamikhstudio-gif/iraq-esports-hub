import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, code, username, fullName, role, primaryGame, city } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكود التحقق مطلوبان' }, { status: 400 });
    }

    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code.trim())
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError || !verification) {
      return NextResponse.json(
        { error: 'كود التحقق غير صحيح أو انتهت صلاحيته' },
        { status: 400 }
      );
    }

    await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    let profile = existingProfile;

    if (!existingProfile && username) {
      const { data: newProfile, error: profileError } = await supabase
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
        return NextResponse.json({ error: 'فشل في إنشاء الحساب: ' + profileError.message }, { status: 500 });
      }
      profile = newProfile;
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'تم تأكيد الحساب بنجاح!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التحقق' },
      { status: 500 }
    );
  }
}