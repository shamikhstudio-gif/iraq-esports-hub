import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { supabase } from '@/lib/supabase';

// Validate environment variables
const API_KEY = process.env.GetStream_API;
const API_SECRET = process.env.GetStream_Secret;

export async function POST(req: Request) {
  try {
    if (!API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'Stream credentials are not configured.' },
        { status: 500 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists in our database
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize Stream server client
    const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

    // Create a token for the user
    // Tokens typically expire, but omitting expiration creates a token that doesn't expire
    const token = serverClient.createToken(userId);

    // We can also sync the user's profile data to Stream here to ensure it's up to date
    await serverClient.upsertUser({
      id: userId,
      name: user.full_name,
      image: user.avatar_url || 'https://via.placeholder.com/150',
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Stream token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
