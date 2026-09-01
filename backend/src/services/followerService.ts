import axios from 'axios';

export class FollowerService {
  /**
   * Fetch current followers count for a Kick channel
   */
  public static async getKickFollowers(channelName: string): Promise<number | null> {
    const clean = channelName.trim().toLowerCase().replace(/^@/, '');
    const candidateSlugs = [
      clean,
      clean.replace(/_/g, '-'),
      clean.replace(/-/g, '_'),
    ];

    for (const slug of candidateSlugs) {
      try {
        const res = await axios.get(`https://kick.com/api/v2/channels/${slug}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
          },
          timeout: 4000,
        });
        if (typeof res.data?.followers_count === 'number') {
          return res.data.followers_count;
        }
        if (typeof res.data?.followersCount === 'number') {
          return res.data.followersCount;
        }
      } catch (e) {}

      try {
        const res1 = await axios.get(`https://kick.com/api/v1/channels/${slug}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
          },
          timeout: 4000,
        });
        if (typeof res1.data?.followers_count === 'number') {
          return res1.data.followers_count;
        }
        if (typeof res1.data?.followersCount === 'number') {
          return res1.data.followersCount;
        }
      } catch (e) {}
    }

    return null;
  }

  /**
   * Fetch current followers count for a Twitch channel
   */
  public static async getTwitchFollowers(channelName: string): Promise<number | null> {
    const clean = channelName.trim().toLowerCase().replace(/^#/, '');
    try {
      const res = await axios.post(
        'https://gql.twitch.tv/gql',
        {
          query: `query { user(login: "${clean}") { followers { totalCount } } }`,
        },
        {
          headers: {
            'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
            'Content-Type': 'application/json',
          },
          timeout: 4000,
        }
      );
      const total = res.data?.data?.user?.followers?.totalCount;
      if (typeof total === 'number') {
        return total;
      }
    } catch (e) {}

    return null;
  }
}
