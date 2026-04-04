import { Injectable, signal } from '@angular/core';

export type Lang = 'fi' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'com.laurakarki.preferredLanguage';

  readonly lang = signal<Lang>(this.loadLang());

  toggle(): void {
    const next: Lang = this.lang() === 'fi' ? 'en' : 'fi';
    this.lang.set(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  }

  private loadLang(): Lang {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'fi' || stored === 'en' ? stored : 'en';
  }
}