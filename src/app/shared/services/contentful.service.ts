import { computed, inject, Injectable, resource } from '@angular/core';
import { createClient } from 'contentful';
import { LanguageService } from './language.service';
import { environment } from '../../../environments/environment';
import type {
  CfEntry,
  ArtworkFields,
  CvEntryFields,
  NewsEntryFields,
  PageContentFields,
  SiteSettingsFields,
  SocialLinkFields,
} from '../models/contentful.model';

@Injectable({ providedIn: 'root' })
export class ContentfulService {
  private lang = inject(LanguageService).lang;

  private client = createClient({
    space: environment.contentful.spaceId,
    accessToken: environment.contentful.accessToken,
    environment: environment.contentful.environment,
  });

  /** Map app locale ('fi'|'en') to Contentful locale code */
  readonly locale = computed(() => (this.lang() === 'fi' ? 'fi' : 'en-US'));

  readonly newsEntries = resource({
    params: () => this.locale(),
    loader: async ({ params: locale }) => {
      const res = await this.client.getEntries({
        content_type: 'newsEntry',
        locale,
        order: ['-fields.date' as any],
        include: 1,
        limit: 5,
      });
      return res.items as unknown as CfEntry<NewsEntryFields>[];
    },
  });

  readonly artworks = resource({
    params: () => this.locale(),
    loader: async ({ params: locale }) => {
      const res = await this.client.getEntries({
        content_type: 'artwork',
        locale,
        order: ['-fields.year' as any],
        include: 2,
        limit: 200,
      });
      return res.items as unknown as CfEntry<ArtworkFields>[];
    },
  });

  readonly cvEntries = resource({
    params: () => this.locale(),
    loader: async ({ params: locale }) => {
      const res = await this.client.getEntries({
        content_type: 'cvEntry',
        locale,
        order: ['fields.sortOrder' as any],
        include: 2,
        limit: 500,
      });
      return res.items as unknown as CfEntry<CvEntryFields>[];
    },
  });

  readonly socialLinks = resource({
    params: () => this.locale(),
    loader: async ({ params: locale }) => {
      const res = await this.client.getEntries({
        content_type: 'socialLink',
        locale,
      });
      return res.items as unknown as CfEntry<SocialLinkFields>[];
    },
  });

  readonly siteSettings = resource({
    params: () => this.locale(),
    loader: async ({ params: locale }) => {
      const res = await this.client.getEntries({
        content_type: 'siteSettings',
        locale,
        include: 2,
        limit: 1,
      });
      return (res.items[0] as unknown as CfEntry<SiteSettingsFields>) ?? null;
    },
  });

  pageContent(slug: string) {
    return resource({
      params: () => ({ locale: this.locale(), slug }),
      loader: async ({ params: { locale, slug } }) => {
        const res = await this.client.getEntries({
          content_type: 'pageContent',
          locale,
          limit: 1,
          ...({ 'fields.pageSlug': slug } as any),
        });
        return (res.items[0] as unknown as CfEntry<PageContentFields>) ?? null;
      },
    });
  }
}