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
      <div class="news-photo-wrapper">
        <img
          ngSrc="/images/a_dog_enjoys_the_fresh_air.jpg"
          fill
          alt="A dog enjoys the fresh air"
          class="news-photo"
          priority
        />
      </div>

      @for (item of newsItems(); track item.titleHtml) {
        <h4 [innerHTML]="item.titleHtml | safeHtml"></h4>
        <p [innerHTML]="item.descHtml | safeHtml"></p>
      }
    </div>
  `,
  styles: [`
    .news-photo-wrapper {
      position: relative;
      width: 100%;
      height: 300px;
      margin-bottom: 1rem;
    }
    .news-photo {
      object-fit: contain;
      object-position: left;
    }
  `],
})
export class LandingComponent {
  private lang = inject(LanguageService).lang;

  readonly newsItems = computed(() => NEWS[this.lang()]);
}