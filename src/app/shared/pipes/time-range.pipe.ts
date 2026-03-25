import { Pipe, PipeTransform } from '@angular/core';
import { CvEntry } from '../models/content.model';

@Pipe({ name: 'timeRange' })
export class TimeRangePipe implements PipeTransform {
  transform(entry: CvEntry): string {
    const start = entry.start ? new Date(entry.start) : undefined;
    const end = entry.end ? new Date(entry.end) : undefined;
    const { continuing, granularity } = entry;

    const yearString = (): string => {
      let ret = start ? start.getUTCFullYear().toString() : '';
      if (end) {
        if (!start) {
          ret += '-' + end.getUTCFullYear();
        } else if (end.getUTCFullYear() !== start.getUTCFullYear()) {
          ret += '-' + end.getUTCFullYear();
        }
      } else if (continuing) {
        ret += '-';
      }
      return ret;
    };

    switch (granularity) {
      case 'year':
        return yearString();

      case 'month': {
        let ret = start ? (start.getUTCMonth() + 1).toString() : '';
        if (!end) {
          ret += '/' + start!.getUTCFullYear();
          if (continuing) ret += '-';
        } else if (
          end.getUTCFullYear() === start!.getUTCFullYear() &&
          end.getUTCMonth() !== start!.getUTCMonth()
        ) {
          ret += '-' + (end.getUTCMonth() + 1) + '/' + start!.getUTCFullYear();
        } else {
          ret +=
            '/' +
            start!.getUTCFullYear() +
            '-' +
            (end.getUTCMonth() + 1) +
            '/' +
            end.getUTCFullYear();
        }
        return ret;
      }

      case 'day':
        return (
          start!.getUTCDate() +
          '.' +
          (start!.getUTCMonth() + 1) +
          '.' +
          start!.getUTCFullYear()
        );

      default:
        return yearString();
    }
  }
}