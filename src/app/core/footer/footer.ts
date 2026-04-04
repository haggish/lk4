import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../shared/services/language.service';
import { ContentfulService } from '../../shared/services/contentful.service';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="lk-footer row" role="contentinfo">
      <div class="col-12 col-sm-1">
        <button
          class="btn btn-link lk-lang-btn"
          (click)="toggle()"
          [attr.aria-label]="langToggleLabel()"
        >{{ langToggleLabel() }}</button>
      </div>
      <div class="col-12 col-sm-6 ms-auto">
        <p class="footer-links">
          @for (link of socialLinks(); track link.sys.id; let last = $last) {
            <a [href]="link.fields.url" target="_blank" rel="noopener noreferrer">
              {{ link.fields.name }}
            </a>
            @if (!last) { - }
          }
        </p>
        <p class="footer-links">{{ emailLabel() }}</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  private langService = inject(LanguageService);
  private contentful = inject(ContentfulService);
  private lang = this.langService.lang;

  readonly langToggleLabel = computed(() =>
    this.lang() === 'fi' ? 'in english' : 'suomeksi'
  );

  readonly socialLinks = computed(() =>
    this.contentful.socialLinks.value() ?? []
  );

  readonly emailLabel = computed(() =>
    this.contentful.siteSettings.value()?.fields.email
    ?? (this.lang() === 'fi'
      ? 'laura piste karki miukumauku gmail piste com'
      : 'laura dot karki at gmail dot com')
  );

  toggle(): void {
    this.langService.toggle();
  }
}
