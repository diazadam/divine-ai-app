import { Podcast } from '@shared/schema';

interface RSSChannel {
  title: string;
  description: string;
  link: string;
  language: string;
  copyright: string;
  author: string;
  email: string;
  image: string;
  category: string;
  explicit: boolean;
  podcasts: Podcast[];
}

export class RSSGenerator {
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toUTCString();
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  generateRSS(channel: RSSChannel): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(channel.title)}</title>
    <description>${this.escapeXml(channel.description)}</description>
    <link>${channel.link}</link>
    <language>${channel.language}</language>
    <copyright>${this.escapeXml(channel.copyright)}</copyright>
    <atom:link href="${channel.link}/feed.xml" rel="self" type="application/rss+xml"/>
    
    <!-- iTunes Podcast Tags -->
    <itunes:author>${this.escapeXml(channel.author)}</itunes:author>
    <itunes:summary>${this.escapeXml(channel.description)}</itunes:summary>
    <itunes:owner>
      <itunes:name>${this.escapeXml(channel.author)}</itunes:name>
      <itunes:email>${channel.email}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${channel.explicit ? 'yes' : 'no'}</itunes:explicit>
    <itunes:category text="${this.escapeXml(channel.category)}"/>
    <itunes:image href="${channel.image}"/>
    
    <!-- Episodes -->
    ${channel.podcasts.map((podcast, index) => `
    <item>
      <title>${this.escapeXml(podcast.title)}</title>
      <description>${this.escapeXml(podcast.description || '')}</description>
      <link>${baseUrl}/podcast/${podcast.id}</link>
      <guid isPermaLink="true">${baseUrl}/podcast/${podcast.id}</guid>
      <pubDate>${this.formatDate(podcast.createdAt || new Date())}</pubDate>
      
      <!-- Audio Enclosure -->
      <enclosure 
        url="${baseUrl}${podcast.audioUrl}"
        type="audio/mpeg"
        length="${podcast.fileSize || 1000000}"/>
      
      <!-- iTunes Episode Tags -->
      <itunes:author>${this.escapeXml(channel.author)}</itunes:author>
      <itunes:subtitle>${this.escapeXml(podcast.description?.substring(0, 100) || '')}</itunes:subtitle>
      <itunes:summary>${this.escapeXml(podcast.description || '')}</itunes:summary>
      <itunes:duration>${this.formatDuration(podcast.duration || 0)}</itunes:duration>
      <itunes:episode>${channel.podcasts.length - index}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>no</itunes:explicit>
      
      <!-- Transcript if available -->
      ${podcast.transcript ? `
      <content:encoded><![CDATA[
        <h2>Episode Transcript</h2>
        <p>${this.escapeXml(podcast.transcript)}</p>
      ]]></content:encoded>
      ` : ''}
    </item>`).join('\n')}
  </channel>
</rss>`;

    return rss;
  }

  generateOPML(channels: RSSChannel[]): string {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Divine AI Podcast Subscriptions</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
    <outline text="AI Generated Podcasts" title="AI Generated Podcasts">
      ${channels.map(channel => `
      <outline 
        type="rss" 
        text="${this.escapeXml(channel.title)}" 
        title="${this.escapeXml(channel.title)}"
        xmlUrl="${channel.link}/feed.xml"
        htmlUrl="${channel.link}"/>`).join('\n')}
    </outline>
  </body>
</opml>`;

    return opml;
  }

  // Generate podcast platforms submission links
  generatePlatformLinks(feedUrl: string): {
    platform: string;
    submitUrl: string;
    icon: string;
    instructions: string;
  }[] {
    return [
      {
        platform: 'Apple Podcasts',
        submitUrl: 'https://podcastsconnect.apple.com/my-podcasts/new-feed',
        icon: '🎵',
        instructions: 'Submit your RSS feed URL to Apple Podcasts Connect'
      },
      {
        platform: 'Spotify',
        submitUrl: 'https://podcasters.spotify.com/pod/submit',
        icon: '🎧',
        instructions: 'Submit to Spotify for Podcasters'
      },
      {
        platform: 'Google Podcasts',
        submitUrl: `https://www.google.com/podcasts/listen?feed=${encodeURIComponent(feedUrl)}`,
        icon: '📻',
        instructions: 'Auto-submit to Google Podcasts'
      },
      {
        platform: 'Amazon Music',
        submitUrl: 'https://music.amazon.com/podcasts/submit',
        icon: '📡',
        instructions: 'Submit to Amazon Music for Podcasters'
      },
      {
        platform: 'iHeartRadio',
        submitUrl: 'https://www.iheart.com/content/submit-your-podcast/',
        icon: '❤️',
        instructions: 'Submit to iHeartRadio'
      },
      {
        platform: 'TuneIn',
        submitUrl: 'https://help.tunein.com/contact/add-podcast-S19TR3Sdf',
        icon: '📻',
        instructions: 'Submit to TuneIn Radio'
      },
      {
        platform: 'Stitcher',
        submitUrl: 'https://partners.stitcher.com/join',
        icon: '🎙️',
        instructions: 'Submit to Stitcher'
      },
      {
        platform: 'Podchaser',
        submitUrl: `https://www.podchaser.com/podcasts/create?rss=${encodeURIComponent(feedUrl)}`,
        icon: '🎯',
        instructions: 'Auto-submit to Podchaser'
      }
    ];
  }
}

export const rssGenerator = new RSSGenerator();