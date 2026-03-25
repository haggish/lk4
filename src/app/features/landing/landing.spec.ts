import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LandingComponent } from './landing';
import { LanguageService } from '../../shared/services/language.service';
import { NEWS } from '../../shared/data/translations';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let langService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
    }).compileComponents();

    langService = TestBed.inject(LanguageService);
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('renders the correct number of news items', () => {
    const headings = fixture.nativeElement.querySelectorAll('h4');
    expect(headings.length).toBe(NEWS.en.length);
  });

  it('renders news title as HTML (contains anchor)', () => {
    const firstH4: HTMLElement = fixture.nativeElement.querySelector('h4');
    expect(firstH4.querySelector('a')).not.toBeNull();
  });

  it('renders English news items by default', () => {
    const firstH4: HTMLElement = fixture.nativeElement.querySelector('h4');
    expect(firstH4.textContent).toContain('Furry Darlings');
  });

  it('renders Finnish news items after switching language', () => {
    langService.toggle();
    fixture.detectChanges();

    const paragraphs: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('p');
    const allText = Array.from(paragraphs).map(p => p.textContent).join(' ');
    expect(allText).toContain('Yksityisnäyttely');
  });

  it('renders the dog photo', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('ng-img') ?? img.src).toBeTruthy();
  });

  it('news items open links in a new tab', () => {
    const anchors: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('h4 a');
    Array.from(anchors).forEach(a => {
      expect(a.getAttribute('target')).toBe('_blank');
    });
  });
});
