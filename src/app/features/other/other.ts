import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContentfulService } from '../../shared/services/contentful.service';
import { RichTextPipe } from '../../shared/pipes/rich-text.pipe';

@Component({
  selector: 'app-other',
  imports: [RichTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrolled-content">
      @if (body(); as doc) {
        <div [innerHTML]="doc | richText"></div>
      }
    </div>
  `,
})
export class OtherComponent {
  private page = inject(ContentfulService).pageContent('other');

  readonly body = computed(() => this.page.value()?.fields.body ?? null);
}