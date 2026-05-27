/**
 * RSS sources — curated from Feedspot German News list + BER/Brandenburg regionals.
 * @see https://rss.feedspot.com/german_news_rss_feeds/
 */
export type FeedSource = {
  id: string;
  label: string;
  url: string;
  /** Prefer for BER corridor (lower fetch priority if needed) */
  regional?: boolean;
};

export const GERMAN_NEWS_FEEDS: FeedSource[] = [
  { id: "berplus", label: "BER+", url: "https://www.ber-plus.de/feed/", regional: true },
  { id: "zeit", label: "ZEIT ONLINE", url: "https://newsfeed.zeit.de/index" },
  { id: "thelocal", label: "The Local Germany", url: "https://feeds.thelocal.com/rss/de" },
  { id: "faz", label: "FAZ", url: "https://www.faz.net/rss/aktuell/" },
  { id: "sz", label: "Süddeutsche Zeitung", url: "https://rss.sueddeutsche.de/rss/Topthemen" },
  { id: "stern", label: "STERN", url: "https://www.stern.de/feed/standard/alle/" },
  { id: "spiegel", label: "DER SPIEGEL", url: "https://www.spiegel.de/schlagzeilen/index.rss" },
  { id: "tagesschau", label: "tagesschau", url: "https://www.tagesschau.de/xml/rss2" },
  { id: "handelsblatt", label: "Handelsblatt", url: "https://www.handelsblatt.com/contentexport/feed/top" },
  { id: "welt", label: "WELT", url: "https://www.welt.de/feeds/latest.rss" },
  { id: "focus", label: "FOCUS online", url: "https://rss.focus.de/fol/XML/rss_folnews.xml" },
  { id: "taz", label: "taz", url: "https://taz.de/!p4608;rss/" },
  { id: "rp", label: "Rheinische Post", url: "https://rp-online.de/feed.rss" },
  { id: "mopo", label: "Hamburger Morgenpost", url: "https://www.mopo.de/feed/" },
  { id: "ga", label: "General-Anzeiger", url: "https://www.ga.de/feed.rss" },
  { id: "germanbrief", label: "German Brief", url: "https://germanbrief.com/blog-feed.xml" },
  { id: "nd", label: "nd-aktuell", url: "https://www.nd-aktuell.de/rss/aktuell.php" },
  // Berlin / Brandenburg — higher BER hit rate
  { id: "rbb-brandenburg", label: "rbb24 Brandenburg", url: "https://www.rbb24.de/brandenburg/index.rss20.xml", regional: true },
  { id: "tagesspiegel", label: "Tagesspiegel", url: "https://www.tagesspiegel.de/contentexport/feed/home", regional: true },
  { id: "morgenpost", label: "Berliner Morgenpost", url: "https://www.morgenpost.de/rss", regional: true },
  { id: "berliner-zeitung", label: "Berliner Zeitung", url: "https://www.berliner-zeitung.de/rss", regional: true },
  { id: "ksta", label: "Kölner Stadt-Anzeiger", url: "https://feed.ksta.de/feed/rss/index.rss" },
  { id: "ln", label: "Lübecker Nachrichten", url: "https://www.ln-online.de/arc/outboundfeeds/rss/" },
  { id: "dw-de", label: "DW Deutsch", url: "https://rss.dw.com/rdf/rss-de-all" }
];

/** YouTube channel RSS (no API key) — BER / region / infrastructure */
export const YOUTUBE_FEEDS: FeedSource[] = [
  {
    id: "yt-fbb",
    label: "YouTube · BER Airport",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsm620o1wT2G5n71UFA"
  },
  {
    id: "yt-dw",
    label: "YouTube · DW Deutsch",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCknLrEdh-5wekqitgrbKQ2w"
  },
  {
    id: "yt-tagesschau",
    label: "YouTube · tagesschau",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCZI0DI6Ya4hzeAEiAmP6GwQ"
  }
];

export const FEED_SOURCES: FeedSource[] = [...GERMAN_NEWS_FEEDS, ...YOUTUBE_FEEDS];
