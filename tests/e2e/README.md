# The flows

What a reader comes here to do, and the test that proves each one still works. The point of the
list is that it is the complete set: if a flow is not here, nothing is watching it.

Run them with `npm run test:e2e` (once: `npx playwright install --with-deps chromium`).

## Reading

| Flow                                                    | Covered by        |
| ------------------------------------------------------- | ----------------- |
| The whole Bible is drawn, and says how much is shown    | `reading.spec.ts` |
| Find a verse by typing its reference                    | `reading.spec.ts` |
| Open a whole chapter and see its verses listed          | `reading.spec.ts` |
| A reference that is not one says so and changes nothing | `reading.spec.ts` |
| Step to the next verse and back                         | `reading.spec.ts` |
| Close the details and return to the whole picture       | `reading.spec.ts` |
| Switch between Arcs and Threads, keeping the passage    | `reading.spec.ts` |

## Cross-references — the reason the app exists

| Flow                                                     | Covered by                 |
| -------------------------------------------------------- | -------------------------- |
| A verse lists where it points and what points at it      | `cross-references.spec.ts` |
| Follow a cross-reference to where it leads               | `reading.spec.ts`          |
| Fold a section away, and find it still folded next visit | `cross-references.spec.ts` |
| The section heading stays put while its list scrolls     | `cross-references.spec.ts` |
| See the genre breakdown of a passage's links             | `cross-references.spec.ts` |
| Raise the vote threshold and see fewer, better links     | `cross-references.spec.ts` |
| Hide a genre from the legend, and bring it back          | `cross-references.spec.ts` |

## The Hebrew and Greek

| Flow                                                          | Covered by               |
| ------------------------------------------------------------- | ------------------------ |
| A Greek verse lists its words, how they sound, what they mean | `original-words.spec.ts` |
| A Hebrew verse says Hebrew, and marks the script for a reader | `original-words.spec.ts` |
| Open a word and see every other verse that uses it            | `original-words.spec.ts` |
| Follow one of those verses                                    | `original-words.spec.ts` |
| The word stays in view while its verses scroll past           | `original-words.spec.ts` |
| The credit stays even when the section is folded away         | `original-words.spec.ts` |

## Translations

| Flow                                                                            | Covered by             |
| ------------------------------------------------------------------------------- | ---------------------- |
| Choose another translation and see the text change                              | `translations.spec.ts` |
| The choice is remembered for the next visit                                     | `translations.spec.ts` |
| The footer credit follows the translation on screen                             | `translations.spec.ts` |
| Copy a passage with its reference, translation and link                         | `translations.spec.ts` |
| Open a verse or chapter in the ESV, NASB 1995 or NLT on bible.com, in a new tab | `translations.spec.ts` |
| …with nothing loaded from bible.com until a link is followed                    | `translations.spec.ts` |
| …and only beside a text in their language                                       | `translations.spec.ts` |

## Sharing

| Flow                                                | Covered by                 |
| --------------------------------------------------- | -------------------------- |
| A shared address opens exactly the passage it names | `reading.spec.ts`          |
| …in the translation it names                        | `translations.spec.ts`     |
| …with the filter it names                           | `cross-references.spec.ts` |
| Back returns to the passage before it               | `reading.spec.ts`          |

## Languages

| Flow                                                                | Covered by          |
| ------------------------------------------------------------------- | ------------------- |
| A link naming a language opens the app in it, `<html lang>` and all | `languages.spec.ts` |
| A Portuguese browser gets a Portuguese interface _and_ Bible        | `languages.spec.ts` |
| The verses and the book names are Portuguese                        | `languages.spec.ts` |
| A reference can be typed in Portuguese, with accents or without     | `languages.spec.ts` |
| A reference it cannot read says so in Portuguese                    | `languages.spec.ts` |
| Counts are written the way a Brazilian writes them                  | `languages.spec.ts` |
| The picker groups translations under their language                 | `languages.spec.ts` |
| The interface language is chosen there too, and remembered          | `languages.spec.ts` |
| Changing the text leaves the interface language alone               | `languages.spec.ts` |
| A shared link carries both the text and the language                | `languages.spec.ts` |

## Installing and reading offline

| Flow                                                            | Covered by        |
| --------------------------------------------------------------- | ----------------- |
| The app and its data are stored on the first visit              | `offline.spec.ts` |
| The app still works with the network gone                       | `offline.spec.ts` |
| A translation chosen while online is there offline too          | `offline.spec.ts` |
| **A new release replaces the old cache instead of being stuck** | `offline.spec.ts` |
| **A withdrawn worker clears everything, in one visit**          | `offline.spec.ts` |
| The install guide opens from the footer, and from `#install`    | `offline.spec.ts` |

The two in bold are the ones worth the most: a cache that cannot be replaced would hold every
installed reader on an old version, and no amount of deploying would reach them. The second is
the way out if it ever happened.

## The shape of the page

| Flow                                                                 | Covered by           |
| -------------------------------------------------------------------- | -------------------- |
| The footer is one line, and on screen, at 320–1920px (twelve widths) | `responsive.spec.ts` |
| …and still one line with a font a tenth wider than this machine's    | `responsive.spec.ts` |
| The details are a side column on a desktop                           | `responsive.spec.ts` |
| …and a sheet at the bottom on a phone, which opens to full height    | `responsive.spec.ts` |
| The header's controls stay reachable on a phone                      | `responsive.spec.ts` |
| Every page loads with nothing in the console                         | `responsive.spec.ts` |

The font test earns its place: the footer is set in whatever UI font the reader's system has, and
those differ in width by about a tenth between the narrowest and the widest. A layout measured on
one machine can wrap on another — which is exactly how a two-line footer at 320px reached CI once.
Walking the font up locally turns that into a failure here instead.

Layout is checked by measuring, not by comparing images: "the footer is 30px tall and its right
edge is inside the viewport" means the same thing on every machine, while a pixel baseline does
not. Pictures are a separate suite — below.

## The gallery

`npm run test:visual` photographs every major screen at a desktop size (1440×900) and on a phone
(Pixel 7), and writes them to `tests/e2e/visual.spec.ts-snapshots/`. Open that folder to see what
the app currently looks like; a change to one of those files in a diff is a change to the app.

| Screen                                         | File                           |
| ---------------------------------------------- | ------------------------------ |
| **The canvas**                                 |                                |
| Arcs, as the app opens                         | `arcs-home`                    |
| Arcs, zoomed in on a part of the canvas        | `arcs-zoomed`                  |
| Arcs, a chapter picked out                     | `arcs-chapter`                 |
| Arcs, a verse picked out                       | `arcs-verse`                   |
| Arcs, with whole genres hidden                 | `arcs-genres-hidden`           |
| Arcs, with every link shown                    | `arcs-all-links`               |
| Arcs, with the genre legend unfolded           | `arcs-legend`, `arcs-genres`   |
| Threads, as the view opens                     | `threads-home`                 |
| Threads, on a verse                            | `threads-verse`                |
| Threads, on a chapter                          | `threads-chapter`              |
| **The details panel**                          |                                |
| A verse and its cross-references               | `verse-panel`                  |
| A whole chapter                                | `chapter-panel`                |
| The panel on its own                           | `panel-only`                   |
| …a chapter, with its verse list                | `panel-chapter-only`           |
| …in another translation                        | `panel-kjv`                    |
| …with every section folded away                | `panel-collapsed`              |
| …with every cross-reference shown              | `panel-show-all`               |
| …just after a reference was copied             | `panel-copied`                 |
| **The original languages**                     |                                |
| A Greek verse and its words                    | `words-greek`                  |
| A Hebrew verse, right to left                  | `words-hebrew`                 |
| A Greek word opened to its verses              | `words-expanded`               |
| A Hebrew word opened to its verses             | `words-hebrew-expanded`        |
| The words folded away                          | `words-collapsed`              |
| The two headings that stay put while scrolling | `words-sticky-headings`        |
| …the same in Hebrew                            | `words-sticky-headings-hebrew` |
| **The controls**                               |                                |
| The filters menu                               | `menu-filters`                 |
| …set to something other than its defaults      | `menu-filters-changed`         |
| The genres menu (Threads)                      | `menu-genres`                  |
| The translations menu                          | `menu-translation`             |
| A reference that is not one                    | `search-error`                 |
| **Everything else**                            |                                |
| The install guide                              | `install-guide`                |
| The loading screen                             | `loading`                      |
| The error screen                               | `load-error`                   |
| The debug dashboard                            | `debug`                        |
| **Every other language**                       |                                |
| The arcs, with the interface translated        | `<id>-arcs`                    |
| A verse and its cross-references               | `<id>-panel`                   |
| The reading threads                            | `<id>-threads`                 |
| …with every section folded away                | `<id>-panel-collapsed`         |
| The picker, this language's Bibles first       | `<id>-translations`            |

English is photographed screen by screen; every other language the app speaks gets the five
shots above, written as a loop over `LOCALE_IDS` so the next language arrives with its own
pictures instead of waiting for somebody to copy a block. `<id>` is the language: `de-panel`,
`uk-threads`, and so on. What changes with the language is the chrome and the text, never the
canvas behind them, which is why a translation needs five pictures and not forty.

Each file is suffixed with the project and platform (`-visual-phone-linux.png`), so baselines made
on macOS and on Linux sit side by side rather than overwriting each other.

**This suite is not part of `npm run test:e2e` or of CI**, on purpose: a baseline belongs to the
machine that drew it, and a font update on a runner would turn the main gate red for no reason.
The first run on a new machine writes its own baselines and reports them as failures — that is
Playwright saying "nothing to compare against yet", not a problem with the app.

After a deliberate design change, re-photograph with `npm run test:visual:update` and look at the
new images before committing them. Prefer `--update-snapshots=all` when the change is one you
expect to be small: the bare flag only rewrites a shot whose comparison _fails_, and the budget
that keeps the arcs stable from run to run (2% of the pixels — about 7,500 on a phone) is wider
than most text changes, so a real change can compare equal and leave the picture on disk showing
a layout the app no longer has. That has happened here.

```sh
npm run test:visual -- --update-snapshots=all
```

### Looking at a before and after

A passing run has nothing to show: Playwright writes `-expected.png`, `-actual.png` and
`-diff.png` only where a comparison _fails_. So to see what changed, put the old baselines back
and let the suite fail against them.

```sh
git switch -c visual-review && git add -A && git commit -m "wip"   # the safety net
git checkout HEAD~1 -- tests/e2e/visual.spec.ts-snapshots          # the old pictures
npm run test:visual                                                # fails where it changed
npm run test:report                                                # the viewer
git checkout HEAD -- tests/e2e/visual.spec.ts-snapshots            # the new ones back
```

The report shows each failure as **Diff / Actual / Expected**, with a side-by-side and a slider.
Commit first rather than stashing the snapshots: a failing run re-creates any baseline that is
missing, which makes `git stash pop` conflict on every picture that is new in this change.

A pull request is the other way, and needs none of this — GitHub's image diff gives swipe and
onion-skin on every changed PNG. What it does not give is the computed diff mask, which is the
one thing the Playwright viewer is better at. To make baselines that CI could share, draw them inside the
same container CI uses:

```sh
docker run --rm -v "$PWD":/w -w /w mcr.microsoft.com/playwright:v1.57.0-jammy \
  npx playwright test --project=visual-desktop --project=visual-phone --update-snapshots
```

## Deliberately not here

- **How the arcs look.** The drawing is GPU work; the suite checks that the canvas appears and
  that the counts beside it are right, not which pixels were lit.
- **Browsers other than Chromium.** These test the app's behaviour, not the engines'.
- **The data itself.** Whether Genesis 1:1 points where OpenBible says is the pipeline's business
  and is covered by the importers' unit tests, against fixtures.
