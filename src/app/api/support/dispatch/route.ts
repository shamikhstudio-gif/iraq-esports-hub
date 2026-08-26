import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, notificationId, type, subject, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'المعلومات غير مكتملة' }, { status: 400 });
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
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ support_dispatched: true })
        .eq('id', notificationId);
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: 'تم إرسال طلب الدعم بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء الإرسال' },
      { status: 500 }
    );
  }
}