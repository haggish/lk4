import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../shared/services/language.service';

interface NavTab {
  route: string;
  fi: string;
  en: string;
}

const TABS: NavTab[] = [
  { route: '/new', fi: 'uutta', en: 'new' },
  { route: '/intro', fi: 'esittely', en: 'intro' },
  { route: '/cv', fi: 'cv', en: 'cv' },
  { route: '/works', fi: 'työt', en: 'works' },
  { route: '/archive', fi: 'arkisto', en: 'archive' },
  { route: '/other', fi: 'muu', en: 'other' },
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="lk-header row" role="banner">
      <div class="col-12 col-sm-7 col-md-4">
        <h1 class="lk-title text-muted">
          laura kärki
          <small>{{ profession() }}</small>
        </h1>
      </div>
      <nav class="col-12 col-sm-5 col-md-4" aria-label="Main navigation">
        <ul class="nav nav-pills lk-navtabs" role="list">
          @for (tab of tabs; track tab.route) {
            <li class="nav-item" role="listitem">
              <a
                class="nav-link"
                [routerLink]="tab.route"
                routerLinkActive="active"
                [attr.aria-label]="tab[lang()]"
              >{{ tab[lang()] }}</a>
            </li>
          }
        </ul>
      </nav>
    </header>
  `,
})
export class HeaderComponent {
  private langService = inject(LanguageService);
  readonly lang = this.langService.lang;
  readonly tabs = TABS;
  readonly profession = computed(() =>
    this.lang() === 'fi' ? 'kuvataiteilija' : 'visual artist'
  );
}
