import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lk-container">
      <app-header />
      <div class="header-back" aria-hidden="true"></div>
      <div class="fadein" aria-hidden="true"></div>
      <main class="content">
        <router-outlet />
      </main>
      <div class="fadeout" aria-hidden="true"></div>
      <div class="footer-back" aria-hidden="true"></div>
      <app-footer />
    </div>
  `,
})
export class LayoutComponent {}
