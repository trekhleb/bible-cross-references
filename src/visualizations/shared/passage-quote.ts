import { formatVerseIndexRange } from '../../core/bible/reference-format.ts';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import type { Versification } from '../../core/bible/versification.ts';
import type { Translation } from '../../translations/translation.ts';

/** A quoted passage: plain text for anywhere, and HTML that rich editors keep as a quote. */
export interface PassageQuote {
  readonly text: string;
  readonly html: string;
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function superscript(mark: string): string {
  return mark.replace(/\d/g, (digit) => SUPERSCRIPT_DIGITS.charAt(Number(digit)));
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * A verse or passage, quoted in full with its reference, translation and a link, e.g.
 *
 *     ¹Now when men began… ²the sons of God saw…
 *     — Genesis 6:1–2 (BSB) https://trekhleb.dev/bible-cross-references/?ref=Gen.6.1
 *
 * A passage's verses are numbered (with the chapter too where it changes). Verses a translation
 * omits are left out.
 */
export function quotePassage({
  translation,
  versification,
  start,
  end,
  url,
}: {
  readonly translation: Translation;
  readonly versification: Versification;
  readonly start: VerseIndex;
  readonly end: VerseIndex;
  readonly url: string;
}): PassageQuote {
  const first = versification.refAt(start);
  const verses: { readonly mark: string | null; readonly text: string }[] = [];
  for (let verse = start; verse <= end; verse += 1) {
    const text = translation.verseText(verse);
    if (text === '') {
      continue;
    }
    const ref = versification.refAt(verse);
    const mark =
      start === end
        ? null
        : ref.book === first.book && ref.chapter === first.chapter
          ? String(ref.verse)
          : `${String(ref.chapter)}:${String(ref.verse)}`;
    verses.push({ mark, text });
  }
  const reference = formatVerseIndexRange(versification, start, end);
  const { abbreviation } = translation.manifest;
  const text = verses.map(({ mark, text }) => (mark ? superscript(mark) : '') + text).join(' ');
  const html = verses
    .map(({ mark, text }) => (mark ? `<sup>${mark}</sup>` : '') + escapeHtml(text))
    .join(' ');
  return {
    text: `${text}\n— ${reference} (${abbreviation}) ${url}`,
    html:
      `<blockquote><p>${html}</p></blockquote>` +
      `<p>— <a href="${escapeHtml(url)}">${escapeHtml(reference)}</a> (${escapeHtml(abbreviation)})</p>`,
  };
}

/** Whether this page may write to the clipboard (only secure pages, e.g. not a LAN address). */
export function canCopy(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'clipboard' in navigator;
}

/** Copies a quote, as HTML and plain text where the browser allows both, else as plain text. */
export async function copyQuote(quote: PassageQuote): Promise<void> {
  if (typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([quote.text], { type: 'text/plain' }),
          'text/html': new Blob([quote.html], { type: 'text/html' }),
        }),
      ]);
      return;
    } catch {
      // Some browsers refuse HTML: plain text still works.
    }
  }
  await navigator.clipboard.writeText(quote.text);
}
