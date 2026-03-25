import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../shared/services/language.service';

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
      <div class="col-12 col-sm-6">
        <p class="footer-links">
          <a href="https://www.instagram.com/laurakarki/" target="_blank" rel="noopener noreferrer">
            {{ igLabel() }}
          </a>
          -
          <a href="http://laurakarki.blogspot.com" target="_blank" rel="noopener noreferrer">
            {{ blogLabel() }}
          </a>
          -
          <a href="https://www.facebook.com/pages/Laura-K%C3%A4rki/651199511588351" target="_blank" rel="noopener noreferrer">
            facebook
          </a>
          -
          <a href="http://www.kuvataiteilijamatrikkeli.fi/fi/taiteilijat/3084" target="_blank" rel="noopener noreferrer">
            {{ aafLabel() }}
          </a>
          -
          <a href="http://www.finnishdesigners.fi/portfolio/laura.karki" target="_blank" rel="noopener noreferrer">
            finnishdesigners
          </a>
        </p>
        <p class="footer-links">{{ emailLabel() }}</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  private langService = inject(LanguageService);
  private lang = this.langService.lang;

  readonly langToggleLabel = computed(() =>
    this.lang() === 'fi' ? 'in english' : 'suomeksi'
  );
  readonly igLabel = computed(() =>
    this.lang() === 'fi' ? 'instagram' : 'instagram'
  );
  readonly blogLabel = computed(() =>
    this.lang() === 'fi' ? 'blogi' : 'blog'
  );
  readonly aafLabel = computed(() =>
    this.lang() === 'fi' ? 'kuvataitelijamatrikkeli' : "artists' association of finland"
  );
  readonly emailLabel = computed(() =>
    this.lang() === 'fi'
      ? 'laura piste karki miukumauku gmail piste com'
      : 'laura dot karki at gmail dot com'
  );

  toggle(): void {
    this.langService.toggle();
  }
}
