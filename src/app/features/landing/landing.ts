import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContentfulService } from '../../shared/services/contentful.service';
import { RichTextPipe } from '../../shared/pipes/rich-text.pipe';

@Component({
  selector: 'app-landing',
  imports: [RichTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrolled-content">
      @if (heroUrl(); as url) {
        <img
          [src]="url"
          [alt]="heroTitle()"
          class="news-photo"
        />
      }

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

  readonly heroUrl = computed(() => {
    const file = this.contentful.siteSettings.value()?.fields.heroImage?.fields?.file;
    return file?.url ? 'https:' + file.url : null;
  });

  readonly heroTitle = computed(() =>
    this.contentful.siteSettings.value()?.fields.heroImage?.fields?.title ?? ''
  );
}
