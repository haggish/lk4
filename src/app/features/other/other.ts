import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-other',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './other.html',
})
export class OtherComponent {
  readonly lang = inject(LanguageService).lang;
}
