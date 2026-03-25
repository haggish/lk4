import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-intro',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intro.html',
})
export class IntroComponent {
  readonly lang = inject(LanguageService).lang;
}