import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface GameItem {
  id: string;
  name: string;
  category?: string;
  image?: string;
  year?: string;
}

// A highly curated list of non-Steam eSports titles with official 16:9 covers.
// We use these because Steam's API won't return games from Riot, Epic, or Mobile.
const NON_STEAM_ESPORTS: GameItem[] = [
  {
    id: 'rocket-league',
    name: 'Rocket League',
    category: 'Sports / Action',
    year: '2015',
  },
  {
    id: 'fall-guys',
    name: 'Fall Guys',
    category: 'Party / Platformer',
    year: '2020',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    category: 'Sandbox / Survival',
    year: '2011',
  },
  {
    id: 'genshin-impact',
    name: 'Genshin Impact',
    category: 'Action RPG',
    year: '2020',
  },
  {
    id: 'teamfight-tactics',
    name: 'Teamfight Tactics',
    category: 'Auto Battler',
    year: '2019',
  },
  {
    id: 'valorant',
    name: 'Valorant',
    category: 'Tactical Shooter',
    year: '2020',
  },
  {
    id: 'league-of-legends',
    name: 'League of Legends',
    category: 'MOBA',
    year: '2009',
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    category: 'Battle Royale',
    year: '2017',
  },
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    category: 'Battle Royale',
    year: '2018',
  },
  {
    id: 'mobile-legends',
    name: 'Mobile Legends: Bang Bang',
    category: 'Mobile MOBA',
    year: '2016',
  },
  {
    id: 'brawl-stars',
    name: 'Brawl Stars',
    category: 'Mobile Action',
    year: '2018',
  },
  {
    id: 'free-fire',
    name: 'Free Fire',
    category: 'Mobile Battle Royale',
    year: '2017',
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      // If no query, return the non-steam esports list as default popular games
      return NextResponse.json({ results: NON_STEAM_ESPORTS });
    }

    const cleanQuery = query.toLowerCase();
    
    // 1. Check non-Steam games first
    const matchedNonSteam = NON_STEAM_ESPORTS.filter(g => 
      g.name.toLowerCase().includes(cleanQuery)
    );

    // 2. Fetch from Official Steam Store API for everything else
    // This requires NO API KEY and returns extremely accurate PC gaming data
    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(steamUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);

    let steamGames: GameItem[] = [];
    
    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        steamGames = data.items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: 'لعبة PC',
          // Use the high quality 16:9 header image from Steam's official CDN
          image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
          year: undefined, // Steam store search doesn't return year directly
        }));
      }
    }

    // Combine results and avoid duplicates if Steam somehow returns a game we already had
    const steamGameNames = new Set(steamGames.map(g => g.name.toLowerCase()));
    const finalNonSteam = matchedNonSteam.filter(g => !steamGameNames.has(g.name.toLowerCase()));

    return NextResponse.json({
      results: [...finalNonSteam, ...steamGames].slice(0, 15),
      query: query,
    });

  } catch (error: any) {
    console.error("Game search error:", error);
    // Fallback to our non-steam list on network error
    return NextResponse.json({ results: NON_STEAM_ESPORTS, error: error.message }, { status: 200 });
  }
}
