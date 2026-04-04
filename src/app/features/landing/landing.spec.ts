import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LandingComponent } from './landing';
import { ContentfulService } from '../../shared/services/contentful.service';

const mockNewsEntries = [
  {
    sys: { id: 'n1' },
    fields: {
      title: 'Test Exhibition',
      date: '2025-04-25',
      body: { nodeType: 'document', data: {}, content: [{ nodeType: 'paragraph', data: {}, content: [{ nodeType: 'text', value: 'A test description', marks: [], data: {} }] }] },
      link: 'https://example.com',
    },
  },
];

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    const mockContentful = {
      newsEntries: { value: signal(mockNewsEntries) },
    };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: ContentfulService, useValue: mockContentful },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('renders news items from Contentful', () => {
    const headings = fixture.nativeElement.querySelectorAll('h4');
    expect(headings.length).toBe(1);
  });

  it('renders news title with link', () => {
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('h4 a');
    expect(anchor).not.toBeNull();
    expect(anchor.textContent?.trim()).toBe('Test Exhibition');
    expect(anchor.href).toContain('example.com');
  });

  it('renders the hero photo', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
  });
});
