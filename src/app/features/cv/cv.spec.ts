import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CvComponent } from './cv';
import { LanguageService } from '../../shared/services/language.service';
import { CV } from '../../shared/data/translations';

describe('CvComponent', () => {
  let fixture: ComponentFixture<CvComponent>;
  let langService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CvComponent],
    }).compileComponents();

    langService = TestBed.inject(LanguageService);
    fixture = TestBed.createComponent(CvComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('renders 3 main section headings', () => {
    const h3s: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('h3');
    expect(h3s.length).toBe(3);
  });

  it('renders English section labels by default', () => {
    const h3s: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('h3');
    const labels = Array.from(h3s).map(h => h.textContent?.trim());
    expect(labels).toContain('Education');
    expect(labels).toContain('Artistic activity');
    expect(labels).toContain('Job experience');
  });

  it('renders Finnish section labels after language switch', () => {
    langService.toggle();
    fixture.detectChanges();

    const h3s: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('h3');
    const labels = Array.from(h3s).map(h => h.textContent?.trim());
    expect(labels).toContain('Koulutus');
    expect(labels).toContain('Taiteellinen toiminta');
    expect(labels).toContain('Työkokemus');
  });

  it('renders subsection headings for Artistic Activity', () => {
    const h4s: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('h4');
    expect(h4s.length).toBeGreaterThan(0);
    const labels = Array.from(h4s).map(h => h.textContent?.trim());
    expect(labels).toContain('Group exhibitions');
    expect(labels).toContain('Grants');
    expect(labels).toContain('Residences');
  });

  it('renders the correct number of education entries', () => {
    // Education section is first; count rows in first section only
    const allRows = fixture.nativeElement.querySelectorAll('.cv-row');
    expect(allRows.length).toBeGreaterThanOrEqual(CV.education.values!.length);
  });

  it('renders time ranges for dated entries', () => {
    const times: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cv-time');
    const nonEmpty = Array.from(times).filter(t => t.textContent?.trim() !== '');
    expect(nonEmpty.length).toBeGreaterThan(0);
  });

  it('renders continuing entries with trailing dash', () => {
    const times: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cv-time');
    const continuing = Array.from(times).find(t => t.textContent?.trim().endsWith('-'));
    expect(continuing).toBeTruthy();
  });

  it('renders month-granularity residency entries correctly', () => {
    const times: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cv-time');
    const monthEntry = Array.from(times).find(t => /^\d+\/\d{4}/.test(t.textContent?.trim() ?? ''));
    expect(monthEntry).toBeTruthy();
  });
});
