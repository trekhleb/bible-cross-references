# Contributing

Thank you for looking. This is a small, deliberately plain project: a static site with no runtime
dependencies beyond React and Three.js, and data built from pinned upstream sources.

## What a pull request has to pass

Both of these run in CI on every pull request, and both have to be green before anything can be
merged or deployed.

```sh
npm run check      # types, lint, formatting, unit tests, coverage thresholds
npm run test:e2e   # the reader's flows, in a real browser against the built site
```

`npm run check` is most of what CI runs, so if it passes locally it almost certainly passes there.
The exception is the generated datasets: `npm run check` never reads them, because it runs beside
the build rather than after it, so CI has one further gate — `npm run test:built`, after
`npm run data:build`, which checks the real scripture rather than a fixture. Run those two
together after any change to `data/sources.json`, an importer or a translation. `npm run check`
fails on:

- a TypeScript error (the config is strict, including `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`; there is no `any` and no `!`, and `as` appears only where
  `Object.fromEntries` loses a key type — `npm run typecoverage` holds the line);
- an ESLint error (type-aware rules, so a floating promise or an unsafe value fails the build);
- a file Prettier would reformat — run `npm run format`;
- a failing unit test;
- **coverage below 98%** of statements, lines and functions.

That last one means new code needs tests in the same pull request. If a change genuinely cannot
be unit-tested — GPU drawing, touch gestures, a page entry point — cover it in `tests/e2e/`
instead and say so in the pull request; the exclusion list in `vite.config.ts` explains the three
categories that are already treated this way.

The end-to-end suite needs the browser once: `npx playwright install --with-deps chromium`.

## Conventions

- **Comments explain why, never what.** The code says what it does; a comment is for the reason,
  the constraint or the thing that would otherwise look like a mistake.
- **Tests read as sentences about behaviour**, not about implementation: `it('opens the first
verse of a chapter given without one')`, not `it('calls indexOf')`.
- **Visualizations never import each other.** `src/app/views.ts` lists them and the app connects
  them; a repository test enforces it.
- **Data is pinned.** Upstream files are fetched against a SHA-256 in `data/sources.json` and the
  build refuses a file that does not match. Changing a source means re-pinning deliberately, with
  `npm run data:fetch -- --update`, and saying in the pull request what changed upstream.

## Translations

Two different jobs, and they are independent.

### A language for the interface

Start with the scaffold, which writes every file a language needs, each of them still English:

```sh
npm run locale:new -- es
```

Then add the language to the six files every language shares. The compiler names each one you
miss, by file and by property:

| File                           | What to add                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `src/i18n/locale-id.ts`        | the tag, in `LOCALE_IDS`                                              |
| `src/i18n/locale-tags.ts`      | its BCP 47 tag and its name in itself                                 |
| `src/i18n/registry.ts`         | the four scaffolded files, assembled into a locale                    |
| `src/i18n/site-copy.ts`        | titles, descriptions, `noscript`, manifest, `hreflang`, share picture |
| `src/i18n/books/acceptance.ts` | what a reader types, checked by somebody who reads the language       |
| `src/i18n/same-as-english.ts`  | `{}` to start with                                                    |
| `src/app/url-contract.test.ts` | a `SAVED` row for `?lang=<id>` and one for `/<id>/`                   |

From there, work until `npm run check` is green. **Green means finished.** There is no
half-finished state that ships: a language the app offers is a language a reader chooses, and
choosing Spanish and getting English menus is worse than not being offered it. The English
fallback in `translate.ts` is a safety net while you write, not a way to release.

`src/i18n/completeness.test.ts` is what decides, and it names every remaining item one at a
time — every message still in English, every blank, every book two books could answer to, every
case the acceptance table has to pin. Work the list down.

**The acceptance table is the part a compiler cannot do for you.** Everything else can be checked
by machine; which book `Jo` means cannot. In Portuguese `Jo` is João and `Jó` is Job, one accent
apart, and which one a reader reaches is decided by whichever claims the unaccented spelling —
nothing in the build would notice if that changed hands. So each language carries the cases a
native speaker signed off on, run through the real parser. CI tells you which spellings your
language has to pin; a native speaker tells you what they should resolve to. Both are required.

A few things no test can ask for: a wrap threshold in `VizPage.module.css` and
`controls.module.css` if the language runs longer than English (the two must agree), and the
language's row in this file and in the README.

### What the gate cannot check, and what a reviewer still has to

Green means every slot is filled with something that is not blank, not the English words, not
another language's catalogue, and not a stub — and that the addresses, the metadata and the
reference parsing all still hold. It does not mean the translation is _good_. A reviewer who
reads the language is still the only thing standing between these and a reader:

- **Whether the words are right.** `'Fechar'` and `'Abrir'` are both valid Portuguese and only
  one of them means Close. Nothing here can tell them apart.
- **Whether a message is a sentence.** A translation built only out of its arguments —
  `(shown, total) => \`${shown}${total}\`` — is not blank, not English, and prints everything it
  was given, so it passes. So does one that puts its arguments in the wrong order.
- **Whether an acceptance row says the right thing.** The rows are checked against the real
  parser, so they catch a change in behaviour — but a pull request can edit a row and the
  behaviour it pins in the same breath. A row is a native speaker's claim; CI only keeps the
  claim honest once it is made.
- **The install steps.** Only each device's name is compared. The steps themselves are rich text
  naming real buttons, and a translator has to check them against their own phone.
- **The share picture.** CI checks that it exists, has its own URL, is the declared size and
  says whether it is a stand-in. Nothing can read the words drawn on it.

A Bible text is checked more loosely than a language: the registry forces the bookkeeping, and
the verse numbering is enforced when the dataset is built. `npm run test:built` adds that the
built file carries a licence and a credit at all, that its provenance is the pin the build
verified, and that no bracket is left open across two verses — but whether the licence named is
the right one, whether the credit is accurate, and the reading direction are still taken on
trust. Read those by hand.

### A Bible text

A pinned source, a manifest and an importer entry. The one hard requirement is verse numbering:
the app indexes every verse by its position in the KJV's 31,102, so a translation that numbers
verses differently needs a mapping before it can be added.

Two different things can be wrong with the numbering, and only one of them is obvious. Wrong
_keys_ — a missing verse, a repeated one, a book outside the canon, the World English Bible's
renumbered doxology of Romans — are refused outright. The right keys with the wrong _contents_
are not, and that is the case to watch for: Hebrew Bibles close Genesis 31, Numbers 29, 1 Samuel
23 and Jonah 1 a verse earlier than the KJV does, so a text that follows them and was never
remapped has all 31,102 keys and its words one verse out. eBible's Reina Valera 1909 is exactly
that, and it was nearly added on the strength of its key count.

The symptom is a blank verse, and `scripts/data/lib/omitted-verses.ts` refuses any verse left
without text that is not one of the sixteen the earliest manuscripts omit. That catches the
common case at build time, but it is a tripwire rather than a proof: before adding a translation,
read the verses either side of those boundaries against a text you already trust, and check the
last verse of an affected chapter as well as the first. The German `deu1912` is a useful place to
start — eBible leaves that edition's own verse numbers in the text, so its 358 markers name every
place the _Luther_ numbering and the KJV's part company. It is not a general map: the Italian
marks 228 places, and only 57 of them are among the German's. Different traditions diverge in
different verses, and a text that carries no markers at all has not thereby been checked.

### Layout

A new language should come with its layout checked, not only its words: translated text is often
longer than English, and the header and footer are tight at 320px. `npm run test:e2e` walks twelve
widths and insists the footer stays on one line with a font a tenth wider than the one it is
measured on, and that no panel scrolls sideways in any language the app offers.

## Data and licences

The datasets are built from CC BY sources (OpenBible.info and STEP Bible / Tyndale House under
CC BY 4.0, Bíblia Livre under CC BY 3.0 BR), the Versión Biblia Libre under CC BY-SA 4.0, the
Uwspółcześniona Biblia Gdańska under CC BY-ND 4.0 (served unchanged, as the licence requires) and
public-domain texts. Every dataset carries its own
licence and attribution fields, because each is served on its own and kept on readers' devices by
the offline cache; the app shows them in the footer, in the translation picker and beside the
words. A credit under a licence names that licence, with a link to it, wherever the text is
shown — a public-domain one may give way on a narrow screen, a licensed one may not. If you add a source, it has to carry the same, and
columns whose licence does not permit redistribution must not be read — `scripts/data/importers/`
has a worked example, with a test that guards it.

See the [README](README.md#development) for the project layout and how the data pipeline works.
