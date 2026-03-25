import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../shared/services/language.service';
import { TimeRangePipe } from '../../shared/pipes/time-range.pipe';
import { CV } from '../../shared/data/translations';
import { CvSection, CvSubsectionKey, Lang } from '../../shared/models/content.model';

const SUBSECTION_ORDER: CvSubsectionKey[] = [
  'selectPrivateExhibitions',
  'groupExhibitions',
  'poemPerformances',
  'worksInCollections',
  'commissionedWorksPublicArt',
  'grants',
  'prizes',
  'memberships',
  'residences',
  'other',
];

@Component({
  selector: 'app-cv',
  imports: [TimeRangePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="list-unstyled scrolled-content">
      @for (section of sections(); track section.key) {
        <li>
          <div class="row">
            <h3 class="col-md-offset-1 col-md-11 col-sm-12">{{ section.label }}</h3>
          </div>

          @if (section.data.values) {
            @for (entry of section.data.values; track $index) {
              <div class="row cv-row">
                <small class="col-md-2 col-sm-3 col-3 cv-time">{{ entry | timeRange }}</small>
                <div class="col-md-9 col-sm-9 col-9">{{ entry[lang()] }}</div>
              </div>
            }
          }

          @if (section.data.subsections) {
            @for (sub of subsectionsFor(section.key); track sub.key) {
              <div class="row">
                <h4 class="col-md-offset-1 col-md-11 col-sm-12 cv-subsection-heading">{{ sub.label }}</h4>
              </div>
              @for (entry of sub.values; track $index) {
                <div class="row cv-row">
                  <small class="col-md-2 col-sm-3 col-3 cv-time">{{ entry | timeRange }}</small>
                  <div class="col-md-9 col-sm-9 col-9">{{ entry[lang()] }}</div>
                </div>
              }
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
  private langService = inject(LanguageService);
  readonly lang = this.langService.lang;

  readonly sections = computed(() => {
    const l = this.lang();
    return [
      { key: 'education' as const, label: CV.education[l], data: CV.education },
      { key: 'artisticActivity' as const, label: CV.artisticActivity[l], data: CV.artisticActivity },
      { key: 'jobExperience' as const, label: CV.jobExperience[l], data: CV.jobExperience },
    ];
  });

  subsectionsFor(sectionKey: 'education' | 'artisticActivity' | 'jobExperience') {
    const section: CvSection = CV[sectionKey];
    if (!section.subsections) return [];
    const l = this.lang();
    return SUBSECTION_ORDER
      .filter(k => section.subsections![k])
      .map(k => {
        const sub = section.subsections![k]!;
        return { key: k, label: sub[l as Lang], values: sub.values };
      });
  }
}
