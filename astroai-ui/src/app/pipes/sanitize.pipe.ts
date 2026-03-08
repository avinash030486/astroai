import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitize'
})
export class SanitizePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    // Convert line breaks to paragraphs and bold markdown
    const paragraphs = value.split('\n\n').map(p => {
      // Convert **text** to <strong>text</strong>
      let formatted = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<p>${formatted.trim()}</p>`;
    }).join('');
    return this.sanitizer.bypassSecurityTrustHtml(paragraphs);
  }
}
