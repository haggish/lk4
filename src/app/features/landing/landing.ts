import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ContentfulService } from '../../shared/services/contentful.service';
import { RichTextPipe } from '../../shared/pipes/rich-text.pipe';

@Component({
  selector: 'app-landing',
  imports: [NgOptimizedImage, RichTextPipe],
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

      @for (item of newsItems(); track item.sys.id) {
        <h4>
          @if (item.fields.link) {
            <a [href]="item.fields.link" target="_blank" rel="noopener noreferrer">
              {{ item.fields.title }}
            </a>
          } @else {
            {{ item.fields.title }}
          }
        </h4>
        <div [innerHTML]="item.fields.body | richText"></div>
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
  private contentful = inject(ContentfulService);

  readonly newsItems = computed(() => this.contentful.newsEntries.value() ?? []);
}
