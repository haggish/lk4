import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { documentToHtmlString, Options } from '@contentful/rich-text-html-renderer';
import { INLINES, type Document } from '@contentful/rich-text-types';

const renderOptions: Options = {
  renderNode: {
    [INLINES.HYPERLINK]: (node, next) =>
      `<a href="${node.data['uri']}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`,
  },
};

@Pipe({ name: 'richText' })
export class RichTextPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(doc: Document | null | undefined): SafeHtml {
    if (!doc) return '';
    const html = documentToHtmlString(doc, renderOptions);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}