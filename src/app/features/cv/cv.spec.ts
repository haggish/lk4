import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CvComponent } from './cv';
import { ContentfulService } from '../../shared/services/contentful.service';

const mockCvEntries = [
  {
    sys: { id: 'e1' },
    fields: {
      time: '2006',
      content: 'Master of Arts, UIAH, Helsinki',
      section: { fields: { name: 'Education', slug: 'education', sortOrder: 1 } },
      sortOrder: 1,
    },
  },
  {
    sys: { id: 'e2' },
    fields: {
      time: '2025',
      content: 'Gallery Halmetoja, Helsinki',
      section: { fields: { name: 'Artistic activity', slug: 'artistic-activity', sortOrder: 2 } },
      category: { fields: { name: 'Select private exhibitions', slug: 'select-private-exhibitions', sortOrder: 1 } },
      sortOrder: 2,
    },
  },
  {
    sys: { id: 'e3' },
    fields: {
      time: '2014–',
      content: 'Showroom Berliini',
      section: { fields: { name: 'Job experience', slug: 'job-experience', sortOrder: 3 } },
      sortOrder: 3,
    },
  },
];

describe('CvComponent', () => {
  let fixture: ComponentFixture<CvComponent>;

  beforeEach(async () => {
    const mockContentful = {
      cvEntries: { value: signal(mockCvEntries) },
    };

    await TestBed.configureTestingModule({
      imports: [CvComponent],
      providers: [
        { provide: ContentfulService, useValue: mockContentful },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvComponent);
    fixture.detectChanges();
  });

  it('renders 3 main section headings', () => {
    const h3s = fixture.nativeElement.querySelectorAll('h3');
    expect(h3s.length).toBe(3);
  });

  it('renders section labels in order', () => {
    const h3s: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('h3');
    const labels = Array.from(h3s).map(h => h.textContent?.trim());
    expect(labels).toEqual(['Education', 'Artistic activity', 'Job experience']);
  });

  it('renders subsection headings for categories', () => {
    const h4s = fixture.nativeElement.querySelectorAll('h4');
    expect(h4s.length).toBe(1);
    expect(h4s[0].textContent?.trim()).toBe('Select private exhibitions');
  });

  it('renders time values', () => {
    const times: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cv-time');
    const values = Array.from(times).map(t => t.textContent?.trim());
    expect(values).toContain('2006');
    expect(values).toContain('2014–');
  });
});
