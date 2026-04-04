import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContentfulService } from '../../shared/services/contentful.service';
import type { CfEntry, CvEntryFields } from '../../shared/models/contentful.model';

interface CvViewCategory {
  name: string;
  slug: string;
  entries: CfEntry<CvEntryFields>[];
}

interface CvViewSection {
  name: string;
  slug: string;
  entries: CfEntry<CvEntryFields>[];
  categories: CvViewCategory[];
}

@Component({
  selector: 'app-cv',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="list-unstyled scrolled-content">
      @for (section of sections(); track section.slug) {
        <li>
          <div class="row">
            <h3 class="col-md-offset-1 col-md-11 col-sm-12">{{ section.name }}</h3>
          </div>

          @for (entry of section.entries; track entry.sys.id) {
            <div class="row cv-row">
              <small class="col-md-2 col-sm-3 col-3 cv-time">{{ entry.fields.time }}</small>
              <div class="col-md-9 col-sm-9 col-9">{{ entry.fields.content }}</div>
            </div>
          }

          @for (cat of section.categories; track cat.slug) {
            <div class="row">
              <h4 class="col-md-offset-1 col-md-11 col-sm-12 cv-subsection-heading">{{ cat.name }}</h4>
            </div>
            @for (entry of cat.entries; track entry.sys.id) {
              <div class="row cv-row">
                <small class="col-md-2 col-sm-3 col-3 cv-time">{{ entry.fields.time }}</small>
                <div class="col-md-9 col-sm-9 col-9">{{ entry.fields.content }}</div>
              </div>
            }
          }
        </li>
      }
    </ul>
  `,
  styles: [`
    .cv-row {
      margin-bottom: 0.25rem;
    }
    .cv-time {
      color: #777;
    }
    h3 {
      margin-top: 1.5rem;
    }
    .cv-subsection-heading {
      margin-top: 1rem;
    }
  `],
})
export class CvComponent {
  private contentful = inject(ContentfulService);

  readonly sections = computed(() => {
    const entries = this.contentful.cvEntries.value() ?? [];
    if (entries.length === 0) return [];

    const sectionMap = new Map<string, {
      name: string;
      slug: string;
      sortOrder: number;
      entries: CfEntry<CvEntryFields>[];
      categoryMap: Map<string, { name: string; slug: string; sortOrder: number; entries: CfEntry<CvEntryFields>[] }>;
    }>();

    for (const entry of entries) {
      const section = entry.fields.section;
      if (!section?.fields) continue;

      const sSlug = section.fields.slug;
      if (!sectionMap.has(sSlug)) {
        sectionMap.set(sSlug, {
          name: section.fields.name,
          slug: sSlug,
          sortOrder: section.fields.sortOrder ?? 0,
          entries: [],
          categoryMap: new Map(),
        });
      }
      const sGroup = sectionMap.get(sSlug)!;

      const category = entry.fields.category;
      if (category?.fields) {
        const cSlug = category.fields.slug;
        if (!sGroup.categoryMap.has(cSlug)) {
          sGroup.categoryMap.set(cSlug, {
            name: category.fields.name,
            slug: cSlug,
            sortOrder: category.fields.sortOrder ?? 0,
            entries: [],
          });
        }
        sGroup.categoryMap.get(cSlug)!.entries.push(entry);
      } else {
        sGroup.entries.push(entry);
      }
    }

    return [...sectionMap.values()]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map<CvViewSection>(s => ({
        name: s.name,
        slug: s.slug,
        entries: s.entries,
        categories: [...s.categoryMap.values()]
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
  });
}
