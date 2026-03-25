import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { LanguageService } from '../../shared/services/language.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { NEWS } from '../../shared/data/translations';

@Component({
  selector: 'app-landing',
  imports: [NgOptimizedImage, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrolled-content">
      <img
        ngSrc="/images/a_dog_enjoys_the_fresh_air.jpg"
        width="873"
        height="845"
        alt="A dog enjoys the fresh air"
        class="news-photo"
        priority
      />

      @for (item of newsItems(); track item.titleHtml) {
        <h4 [innerHTML]="item.titleHtml | safeHtml"></h4>
        <p [innerHTML]="item.descHtml | safeHtml"></p>
      }
    </div>
  `,
  styles: [`
    .news-photo {
      display: block;
      max-width: 100%;
      height: auto;
      margin-bottom: 1rem;
    }
  `],
})
export class LandingComponent {
  private lang = inject(LanguageService).lang;

  readonly newsItems = computed(() => NEWS[this.lang()]);
}