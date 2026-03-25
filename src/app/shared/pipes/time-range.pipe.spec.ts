import { TimeRangePipe } from './time-range.pipe';
import { CvEntry } from '../models/content.model';

function entry(opts: Partial<CvEntry>): CvEntry {
  return { fi: '', en: '', ...opts };
}

describe('TimeRangePipe', () => {
  let pipe: TimeRangePipe;

  beforeEach(() => {
    pipe = new TimeRangePipe();
  });

  // ── year granularity ──────────────────────────────────────────────────────

  describe('year granularity', () => {
    it('renders a single year', () => {
      expect(pipe.transform(entry({ granularity: 'year', start: '2006-01-01T00:00:00.000Z' }))).toBe('2006');
    });

    it('renders a year range', () => {
      expect(pipe.transform(entry({ granularity: 'year', start: '2011-01-01T00:00:00.000Z', end: '2013-01-01T00:00:00.000Z' }))).toBe('2011-2013');
    });

    it('omits end when same year', () => {
      expect(pipe.transform(entry({ granularity: 'year', start: '2020-01-01T00:00:00.000Z', end: '2020-06-01T00:00:00.000Z' }))).toBe('2020');
    });

    it('appends dash for continuing entries', () => {
      expect(pipe.transform(entry({ granularity: 'year', start: '2014-01-01T00:00:00.000Z', continuing: true }))).toBe('2014-');
    });
  });

  // ── month granularity ─────────────────────────────────────────────────────

  describe('month granularity', () => {
    it('renders month/year for single month', () => {
      expect(pipe.transform(entry({ granularity: 'month', start: '2013-09-01T00:00:00.000Z' }))).toBe('9/2013');
    });

    it('renders month range within same year', () => {
      expect(pipe.transform(entry({ granularity: 'month', start: '2024-01-01T00:00:00.000Z', end: '2024-02-01T00:00:00.000Z' }))).toBe('1-2/2024');
    });

    it('renders month/year range across different years', () => {
      expect(pipe.transform(entry({ granularity: 'month', start: '2023-01-01T00:00:00.000Z', end: '2026-06-01T00:00:00.000Z' }))).toBe('1/2023-6/2026');
    });

    it('appends dash for continuing entries', () => {
      expect(pipe.transform(entry({ granularity: 'month', start: '2018-04-01T00:00:00.000Z', continuing: true }))).toBe('4/2018-');
    });
  });

  // ── day granularity ───────────────────────────────────────────────────────

  describe('day granularity', () => {
    it('renders d.m.yyyy', () => {
      expect(pipe.transform(entry({ granularity: 'day', start: '2009-08-05T00:00:00.000Z' }))).toBe('5.8.2009');
    });
  });

  // ── default (no granularity) ──────────────────────────────────────────────

  describe('default (no granularity set)', () => {
    it('falls back to year string', () => {
      expect(pipe.transform(entry({ start: '2012-01-01T00:00:00.000Z' }))).toBe('2012');
    });

    it('falls back to year range', () => {
      expect(pipe.transform(entry({ start: '2002-01-01T00:00:00.000Z', end: '2007-01-01T00:00:00.000Z' }))).toBe('2002-2007');
    });

    it('falls back to continuing dash', () => {
      expect(pipe.transform(entry({ start: '2012-01-01T00:00:00.000Z', continuing: true }))).toBe('2012-');
    });
  });

  // ── no dates ─────────────────────────────────────────────────────────────

  it('returns empty string when no dates provided', () => {
    expect(pipe.transform(entry({}))).toBe('');
  });
});