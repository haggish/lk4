import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header';
import { LanguageService } from '../../shared/services/language.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let langService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    langService = TestBed.inject(LanguageService);
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('renders the artist name', () => {
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('laura kärki');
  });

  it('renders 6 navigation tabs', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.nav-item');
    expect(tabs.length).toBe(6);
  });

  it('shows English tab labels by default', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('.nav-link');
    const labels = Array.from(links).map(a => a.textContent?.trim());
    expect(labels).toContain('new');
    expect(labels).toContain('works');
    expect(labels).toContain('cv');
  });

  it('shows Finnish tab labels after switching to Finnish', () => {
    langService.toggle();
    fixture.detectChanges();

    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('.nav-link');
    const labels = Array.from(links).map(a => a.textContent?.trim());
    expect(labels).toContain('uutta');
    expect(labels).toContain('työt');
    expect(labels).toContain('arkisto');
  });

  it('shows "visual artist" profession in English', () => {
    const small: HTMLElement = fixture.nativeElement.querySelector('small');
    expect(small.textContent?.trim()).toBe('visual artist');
  });

  it('shows "kuvataiteilija" profession in Finnish', () => {
    langService.toggle();
    fixture.detectChanges();

    const small: HTMLElement = fixture.nativeElement.querySelector('small');
    expect(small.textContent?.trim()).toBe('kuvataiteilija');
  });

  it('nav links include correct routes', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('.nav-link');
    const hrefs = Array.from(links).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/new');
    expect(hrefs).toContain('/cv');
    expect(hrefs).toContain('/works');
  });
});
