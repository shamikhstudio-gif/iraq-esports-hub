import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resend, generateVerificationEmailHtml } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error: dbError } = await supabase
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

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح',
      demoCode: code,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال كود التحقق' },
      { status: 500 }
    );
  }
}