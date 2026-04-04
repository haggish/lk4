import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgbCarousel, NgbSlide } from '@ng-bootstrap/ng-bootstrap';
import { ContentfulService } from '../../shared/services/contentful.service';
import type { CfEntry, ArtworkFields } from '../../shared/models/contentful.model';

@Component({
  selector: 'app-works',
  imports: [NgbCarousel, NgbSlide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngb-carousel
      aria-label="Works carousel"
      [showNavigationArrows]="true"
      [showNavigationIndicators]="false"
      [keyboard]="true"
    >
      @for (item of items(); track item.sys.id) {
        <ng-template ngbSlide>
          <div class="carousel-image-container">
            @if (imageUrl(item); as url) {
              <img
                class="carousel-img"
                [src]="url"
                [alt]="item.fields.title"
              />
            }
          </div>
          <div class="carousel-caption">
            <h3>{{ item.fields.title }}</h3>
            <p>{{ item.fields.dimensions }}</p>
          </div>
        </ng-template>
      }
    </ngb-carousel>
  `,
  styles: [`
    :host {
      display: block;
    }
    .carousel-image-container {
      height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
    .carousel-img {
      max-height: 70vh;
      max-width: 100%;
      object-fit: contain;
    }
  `],
})
export class WorksComponent {
  private contentful = inject(ContentfulService);

  readonly items = computed(() =>
    (this.contentful.artworks.value() ?? [])
      .filter(a => !a.fields.isArchive)
  );

  imageUrl(item: CfEntry<ArtworkFields>): string | null {
    const url = item.fields.image?.fields?.file?.url;
    return url ? 'https:' + url : null;
  }
}
