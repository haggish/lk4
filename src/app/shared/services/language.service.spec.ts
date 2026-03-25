import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to "en" when localStorage is empty', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.lang()).toBe('en');
  });

  it('reads stored "fi" from localStorage', () => {
    localStorage.setItem('com.laurakarki.preferredLanguage', 'fi');
    const service = TestBed.inject(LanguageService);
    expect(service.lang()).toBe('fi');
  });

  it('reads stored "en" from localStorage', () => {
    localStorage.setItem('com.laurakarki.preferredLanguage', 'en');
    const service = TestBed.inject(LanguageService);
    expect(service.lang()).toBe('en');
  });

  it('ignores invalid stored values and defaults to "en"', () => {
    localStorage.setItem('com.laurakarki.preferredLanguage', 'de');
    const service = TestBed.inject(LanguageService);
    expect(service.lang()).toBe('en');
  });

  it('toggles from "en" to "fi"', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.lang()).toBe('en');
    service.toggle();
    expect(service.lang()).toBe('fi');
  });

  it('toggles from "fi" to "en"', () => {
    localStorage.setItem('com.laurakarki.preferredLanguage', 'fi');
    const service = TestBed.inject(LanguageService);
    service.toggle();
    expect(service.lang()).toBe('en');
  });

  it('persists language to localStorage after toggle', () => {
    const service = TestBed.inject(LanguageService);
    service.toggle();
    expect(localStorage.getItem('com.laurakarki.preferredLanguage')).toBe('fi');
  });

  it('persists language to localStorage on second toggle', () => {
    const service = TestBed.inject(LanguageService);
    service.toggle();
    service.toggle();
    expect(localStorage.getItem('com.laurakarki.preferredLanguage')).toBe('en');
  });
});