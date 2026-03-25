import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FooterComponent } from './footer';
import { LanguageService } from '../../shared/services/language.service';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let langService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    langService = TestBed.inject(LanguageService);
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('shows "suomeksi" toggle when language is English', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.textContent?.trim()).toBe('suomeksi');
  });

  it('shows "in english" toggle when language is Finnish', () => {
    langService.toggle();
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.textContent?.trim()).toBe('in english');
  });

  it('calls toggle() on the service when button is clicked', () => {
    const spy = vi.spyOn(langService, 'toggle');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('toggles language when button is clicked', () => {
    expect(langService.lang()).toBe('en');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(langService.lang()).toBe('fi');
  });

  it('shows English obfuscated email in English', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('laura dot karki at gmail dot com');
  });

  it('shows Finnish obfuscated email in Finnish', () => {
    langService.toggle();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('laura piste karki miukumauku gmail piste com');
  });

  it('renders instagram link', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map(a => a.href);
    expect(hrefs.some(h => h.includes('instagram.com'))).toBe(true);
  });

  it('renders facebook link', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map(a => a.href);
    expect(hrefs.some(h => h.includes('facebook.com'))).toBe(true);
  });
});
