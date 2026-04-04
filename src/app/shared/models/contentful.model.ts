import type { Document } from '@contentful/rich-text-types';

/** Minimal sys metadata from Contentful entries */
export interface CfSys {
  id: string;
  type: string;
  contentType?: { sys: { id: string } };
}

/** Resolved Contentful entry shape */
export interface CfEntry<T> {
  sys: CfSys;
  fields: T;
}

/** Resolved Contentful asset shape */
export interface CfAsset {
  sys: CfSys;
  fields: {
    title?: string;
    file?: {
      url: string;
      contentType: string;
      fileName: string;
    };
  };
}

// ── Resolved field types ───────────────────────────────────────────────

export interface ArtworkCategoryFields {
  name: string;
  slug: string;
  sortOrder?: number;
}

export interface CvSectionFields {
  name: string;
  slug: string;
  sortOrder?: number;
}

export interface CvCategoryFields {
  name: string;
  slug: string;
  sortOrder?: number;
  section: CfEntry<CvSectionFields>;
}

export interface SocialLinkFields {
  name: string;
  url: string;
  icon?: string;
}

export interface ArtworkFields {
  title: string;
  year?: number;
  dimensions?: string;
  image?: CfAsset;
  category?: CfEntry<ArtworkCategoryFields>;
  isArchive?: boolean;
}

export interface NewsEntryFields {
  title: string;
  date: string;
  body?: Document;
  link?: string;
}

export interface CvEntryFields {
  time?: string;
  content: string;
  section: CfEntry<CvSectionFields>;
  category?: CfEntry<CvCategoryFields>;
  sortOrder?: number;
}

export interface PageContentFields {
  pageSlug: string;
  body?: Document;
}

export interface SiteSettingsFields {
  profession?: string;
  email?: string;
  heroImage?: CfAsset;
  socialLinks?: CfEntry<SocialLinkFields>[];
}
