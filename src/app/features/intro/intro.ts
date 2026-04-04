import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ContentfulService } from '../../shared/services/contentful.service';
import { RichTextPipe } from '../../shared/pipes/rich-text.pipe';

@Component({
  selector: 'app-intro',
  imports: [NgOptimizedImage, RichTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrolled-content">
      @if (body(); as doc) {
        <h3>Bio</h3>
        <p class="bio">
          <span class="bio-photo-wrapper">
            <img ngSrc="/images/eka.jpg" width="200" height="267" alt="Laura Kärki" class="bio-img" />
          </span>
        </p>
        <div [innerHTML]="doc | richText"></div>
      }
    </div>
  `,
})
export class IntroComponent {
  private page = inject(ContentfulService).pageContent('intro');

  readonly body = computed(() => this.page.value()?.fields.body ?? null);
}