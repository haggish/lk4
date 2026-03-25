export type Lang = 'fi' | 'en';

export interface WorkItem {
  name: string;
  desc: string;
}

export interface WorkItemBilingual {
  fi: WorkItem;
  en: WorkItem;
}

export interface NewsItem {
  titleHtml: string;
  descHtml: string;
}

export interface CvEntry {
  start?: string;
  end?: string;
  continuing?: boolean;
  granularity?: 'year' | 'month' | 'day';
  fi: string;
  en: string;
}

export interface CvSubsection {
  fi: string;
  en: string;
  values: CvEntry[];
}

export interface CvSection {
  fi: string;
  en: string;
  values?: CvEntry[];
  subsections?: Partial<Record<CvSubsectionKey, CvSubsection>>;
}

export type CvSubsectionKey =
  | 'selectPrivateExhibitions'
  | 'groupExhibitions'
  | 'poemPerformances'
  | 'worksInCollections'
  | 'commissionedWorksPublicArt'
  | 'grants'
  | 'prizes'
  | 'memberships'
  | 'residences'
  | 'other';

export interface CvData {
  education: CvSection;
  artisticActivity: CvSection;
  jobExperience: CvSection;
}