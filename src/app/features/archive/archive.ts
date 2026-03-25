import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgbCarousel, NgbSlide } from '@ng-bootstrap/ng-bootstrap';
import { LanguageService } from '../../shared/services/language.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { ARCHIVE } from '../../shared/data/translations';

@Component({
  selector: 'app-archive',
  imports: [NgbCarousel, NgbSlide, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngb-carousel
      aria-label="Archive carousel"
      [showNavigationArrows]="true"
      [showNavigationIndicators]="false"
      [keyboard]="true"
    >
      @for (item of items(); track item.name; let i = $index) {
        <ng-template ngbSlide>
          <div class="carousel-image-container">
            <img
              class="carousel-img"
              [src]="'/archive/' + (i + 1) + '.jpg'"
              [alt]="item.name"
            />
          </div>
          <div class="carousel-caption">
            <h3>{{ item.name }}</h3>
            <p [innerHTML]="item.desc | safeHtml"></p>
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
export class ArchiveComponent {
  private lang = inject(LanguageService).lang;

  readonly items = computed(() => ARCHIVE.map(w => w[this.lang()]));
}
