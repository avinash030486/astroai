import * as fs from 'fs';
import * as path from 'path';

interface CityData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  slug: string;
}

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Import cities data
const citiesModule = require('../src/app/data/cities.ts');
const cities: CityData[] = citiesModule.TOP_CITIES || [];

// Import yogas data
const yogasModule = require('../src/app/data/yogas.ts');
const yogas = yogasModule.VEDIC_YOGAS || [];

class SitemapGenerator {
  private baseUrl = 'https://vedicastro.app';
  private urls: SitemapUrl[] = [];

  constructor() {
    this.generateStaticPages();
    this.generateCityPages();
    this.generateYogaPages();
  }

  private generateStaticPages(): void {
    const today = new Date().toISOString().split('T')[0];

    // Main pages
    this.addUrl('/', today, 'daily', 1.0);
    this.addUrl('/home', today, 'weekly', 0.8);
    
    // Feature pages
    this.addUrl('/daily-prediction', today, 'daily', 0.9);
    this.addUrl('/daily-panchang', today, 'daily', 0.95);
    this.addUrl('/yearly-horoscope', today, 'weekly', 0.85);
    this.addUrl('/remedies', today, 'weekly', 0.85);
    this.addUrl('/birth-chart', today, 'weekly', 0.8);
    this.addUrl('/horoscope', today, 'weekly', 0.8);
    this.addUrl('/numerology', today, 'weekly', 0.7);
    this.addUrl('/matchmaking', today, 'weekly', 0.7);
    
    // City directory
    this.addUrl('/city-panchang', today, 'weekly', 0.9);
  }

  private generateCityPages(): void {
    const today = new Date().toISOString().split('T')[0];

    cities.forEach(city => {
      // Today
      this.addUrl(`/panchang/${city.slug}/today`, today, 'daily', 0.9);
      
      // Tomorrow
      this.addUrl(`/panchang/${city.slug}/tomorrow`, today, 'daily', 0.85);
      
      // Next 7 days with specific dates
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        this.addUrl(`/panchang/${city.slug}/${dateStr}`, today, 'daily', 0.8);
      }
    });

    console.log(`✅ Generated ${cities.length * 9} city-specific URLs`);
  }

  private generateYogaPages(): void {
    const today = new Date().toISOString().split('T')[0];

    // Yoga list page
    this.addUrl('/yogas', today, 'weekly', 0.9);

    // Individual yoga pages
    yogas.forEach((yoga: any) => {
      this.addUrl(`/yoga/${yoga.slug}`, today, 'monthly', 0.85);
    });

    console.log(`✅ Generated ${yogas.length + 1} yoga URLs (1 list + ${yogas.length} detail pages)`);
  }

  private addUrl(
    path: string,
    lastmod: string,
    changefreq: SitemapUrl['changefreq'],
    priority: number
  ): void {
    this.urls.push({
      loc: `${this.baseUrl}${path}`,
      lastmod,
      changefreq,
      priority
    });
  }

  public generateXml(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    this.urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  public save(filename: string = 'sitemap.xml'): void {
    const xml = this.generateXml();
    const outputPath = path.join(__dirname, '..', 'src', filename);
    
    fs.writeFileSync(outputPath, xml, 'utf8');
    console.log(`✅ Sitemap generated successfully: ${outputPath}`);
    console.log(`📊 Total URLs: ${this.urls.length}`);
  }
}

// Execute
const generator = new SitemapGenerator();
generator.save();
