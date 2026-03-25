import { TestBed } from '@angular/core/testing';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      pipe = new SafeHtmlPipe();
    });
  });

  it('returns a SafeHtml value (not a plain string)', () => {
    const result = pipe.transform('<a href="https://example.com">link</a>');
    expect(typeof result).not.toBe('string');
  });

  it('does not strip anchor tags', () => {
    const result = pipe.transform('<a target="_blank" href="https://example.com">link</a>');
    expect(String(result)).toContain('href');
  });

  it('handles plain text without error', () => {
    expect(() => pipe.transform('plain text')).not.toThrow();
  });
});