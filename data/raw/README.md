# Raw data

Unmodified copies of the upstream files the app is built from. The small ones are committed so
that the site can be rebuilt even if an upstream URL disappears; the eBible archives are not,
because 4–5 MB apiece is more than a repository should carry for one translation, so
`npm run data:build` downloads them on demand instead. Either way `../sources.json` pins the file
by SHA-256 and the build
refuses anything that does not match it, before turning them into the datasets in `public/data/`.

| File                                                        | Source                                                                                                                                                                                                                                                                     | License                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `bsb.txt`                                                   | [Berean Standard Bible](https://berean.bible/), from <https://bereanbible.com/bsb.txt>, retrieved 2026-09-25                                                                                                                                                               | Public domain ("dedicated to the public domain", per the file)  |
| `openbible-cross-references.zip`                            | [OpenBible.info cross-references](https://www.openbible.info/labs/cross-references/), from <https://a.openbible.info/data/cross-references.zip>, snapshot 2026-09-21                                                                                                       | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)       |
| `bliv-tr_vpl.zip`                                           | [Bíblia Livre](https://sites.google.com/site/biblialivre/) (Textus Receptus edition, February 2018), from the project's own [GitHub release](https://github.com/blivre/BibliaLivre/releases/tag/2018.2.0)                                                                  | [CC BY 3.0 BR](https://creativecommons.org/licenses/by/3.0/br/) |
| `eng-kjv2006_vpl.zip` (not committed; fetched by the build) | [King James Version](https://ebible.org/Scriptures/details.php?id=eng-kjv2006), from <https://ebible.org/Scriptures/eng-kjv2006_vpl.zip>, retrieved 2026-10-17                                                                                                             | Public domain (in the United Kingdom: Crown copyright)          |
| `deu1912_vpl.zip` (not committed; fetched by the build)     | [Lutherbibel 1912](https://ebible.org/Scriptures/details.php?id=deu1912), from <https://ebible.org/Scriptures/deu1912_vpl.zip>, retrieved 2026-10-19                                                                                                                       | Public domain                                                   |
| `ita1927_vpl.zip` (not committed; fetched by the build)     | [Riveduta 1927](https://ebible.org/Scriptures/details.php?id=ita1927), from <https://ebible.org/Scriptures/ita1927_vpl.zip>, retrieved 2026-10-19                                                                                                                          | Public domain                                                   |
| `spavbl_vpl.zip` (not committed; fetched by the build)      | [Versión Biblia Libre](https://ebible.org/Scriptures/details.php?id=spavbl), from <https://ebible.org/Scriptures/spavbl_vpl.zip>, retrieved 2026-10-19                                                                                                                     | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `stepbible-*.txt` (not committed; fetched by the build)     | [STEPBible](https://github.com/STEPBible/STEPBible-Data) tagged Hebrew (TAHOT) and Greek (TAGNT) with the TBESH and TBESG lexicons, at commit [`be4191f`](https://github.com/STEPBible/STEPBible-Data/tree/be4191f0082aeedddb0eff0c02c966292b2bd641), retrieved 2026-10-16 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)       |

Attribution for the scripture texts: _Berean Standard Bible (BSB), dedicated to the public
domain._ and _King James Version (Authorized Version), the 1769 text; public domain in the United
States and most of the world, Crown copyright in the United Kingdom._ And, for the Portuguese:
_Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018,
licensed under CC BY 3.0 Brasil (<http://creativecommons.org/licenses/by/3.0/br/>)._ Modified:
whitespace is normalized, which touches **271 verses in 23 books** — 270 where the spacing around
a colon moves (a space before it moves to after it, and a missing space after one is inserted)
and one, Zechariah 7:13, where a non-breaking space becomes an ordinary one. Not one
non-whitespace character of the Bíblia Livre differs from the source.

The King James text is changed in one way of its own: the pilcrows that mark a paragraph in
eBible's edition are removed, in **2,970 verses across 42 books**. They are a typographic mark
rather than wording, and the app sets paragraphs itself. The text is public domain, so this
carries no licence condition; it is recorded here because the repository should say what its
build does to every text it ships.

The square brackets the translators put around words they supplied are **kept**. They are not
typography: in the source they are an explicit `\added` element, the convention printed Bibles set
in italics, and they mark the difference between what the Greek and Hebrew say and what Portuguese
needed added to read. They cover 4,838 verses in 62 books, and removing them would present a
translator's own additions as original text — which is the kind of change the integrity of a work
protects against, quite apart from what the licence permits. The same reasoning keeps them in the
KJV, where they cover 14,241 verses. The
translators ask that the edition's date always be given, because the work is ongoing; the manifest
in `src/translations/registry.ts` carries it, and the app shows it where the translation is chosen.

The project's own repository states CC BY 3.0 Brasil, while eBible.org's rebuild of the same text
states CC BY 4.0 — citing a Brazil-ported 4.0 that does not exist, since 4.0 was never ported to
national jurisdictions. What is pinned here is the authors' own release asset, so the licence that
came with this copy is the one they published with it. Both versions permit redistributing the
whole text with attribution, but they are not interchangeable: 3.0 terminates automatically on a
breach with no cure, where 4.0 reinstates if the breach is cured within thirty days. 3.0 BR is the
stricter of the two and the one the app complies with.

Attribution for the German: _Lutherbibel 1912, the 1912 revision of Martin Luther's German
translation. Public domain._ Luther died in 1546; the 1912 revision was the work of a church
committee and was published in 1912, so it is out of copyright under every rule that could apply
to it — life plus seventy, Germany's seventy years from publication for a work with no named
author (UrhG §66), and the United States' ninety-five years from publication, which ran out in 2008. It is not the Luther 1984 or the
Luther 2017, both of which the Deutsche Bibelgesellschaft still holds rights in. "Lutherbibel" is
not a registered trademark: a TMview search returns nothing for it, while the same search run
against "reina valera" correctly returns the United Bible Societies' marks, so the absence is a
result and not a broken query. Searching for "neueluther" separately does return two marks for
**NeueLuther Bibel**, a modern work of La Buona Novella Inc. — which is why that name is not
used here.

Modified: eBible republishes this edition against KJV verse numbering while leaving the edition's
own number in the text, as `GEN 32:1 [32:2] Jakob aber zog seinen Weg`. German Bibles follow the
Hebrew and close Genesis 31 a verse earlier than the KJV does, so the numbers disagree from there
on. Those markers are removed, in **358 verses** — 357 giving a chapter and a verse, and one
(Isaiah 64:2) giving a half-verse. Where eBible joined two of the edition's verses into one, the
marker sits mid-sentence and goes the same way. With the one further correction below,
30,743 of the 31,102 verses are
character-for-character the source text. The
app addresses every verse by its KJV number and shows that number, so a second, disagreeing
number inside the text would only mislead.

One further verse is corrected. Judges 11:25 reads `…auch je gerechtet 518heeft oder gestritten
wider Israel?` in the source: a Strong's number welded to the Dutch word _heeft_, in a German
text. Of the two places in the Lutherbibel where a digit touches a letter, the other is the `[1b]`
marker above, so this is the only one that is not an editor's note; taking it out
leaves the reading the edition has. It is recorded verse by verse in
`scripts/data/lib/source-defects.ts` rather than matched by a rule.

Attribution for the Italian: _Riveduta 1927, the Italian revision made under Giovanni Luzzi.
Public domain._ Luzzi chaired the revision commission rather than translating it alone, which is
why the credit says "under" — eBible names no translator at all and credits the Bible Society in
Italy as contributor. He was born on 8 March 1856 and died on 25 January 1948, so on the longest
reading — the whole work as his — it left copyright in Italy and most of the EU on 1 January
2019; as a collective work published in 1927 it left even earlier. It is public domain in the
United States as a work published in 1927. Two places run longer: Spain keeps the old 80-year
post-mortem term for authors who died before 1987, which would reach 2029, and Mexico runs life
plus 100. There is no identifiable claimant in either, and digitising a public-domain text
creates no new copyright in it — a faithful transcription is not the transcriber's own
intellectual creation, which is the originality standard EU law applies. (Italy does grant a
twenty-year right over _critical and scientific_ editions of public-domain works, Art. 85-quater
of L.633/1941; a straight transcription is not one.) It is not the Nuova Riveduta, a 1994
revision published by the Società Biblica di Ginevra that remains in copyright. "Riveduta" is not
a registered trademark either, by the same search.

Modified: this edition carries the same kind of marker as the German, written a different way —
`JON 1:17 (H2-1) E l'Eterno fece venire un gran pesce`, where `H` and `G` name the Hebrew and
Greek numbering it follows. Those are removed, in **228 verses** (229 markers: Revelation 13:1
carries two, because the edition's 12:18 and 13:1 are joined there). Three further verses —
Matthew 3:17, 5:48 and 20:34 — end with a running head that eBible's conversion welded onto the
last verse of the chapter before it (`…nel quale mi son compiaciuto. Matteo Capitolo 4`), and
those are removed too, verse by verse. A fourth verse, 2 Samuel 20:26, begins with a stray `ò`
where eBible split the edition's 20:25 to fit the KJV's 26, and that goes as well. Of the 31,102
verses, 30,870 are character-for-character the source text. Nothing in this edition needed the whitespace repair the Bíblia Livre needed.

Both of those got through a check written for the shape of the defect before them: the
parenthesised numbers escaped a rule written for the German's square brackets, and the chapter
headings escaped the rule written for both, because a heading in running prose has no bracket to
match. So the shape rules are now backed by two things that do not depend on guessing the next
shape. `scripts/data/lib/source-defects.ts` lists the leftovers one verse at a time, with what is
removed and why, and fails the build if a correction stops applying. And `data/datasets.lock.json`
records, beside the character count, how many verses of each translation contain a digit — one
for the Lutherbibel and two for the Riveduta, both legitimate, where before the corrections they
were two and five. That number is small enough to read every entry, which is how these were
found. Neither is a general check for editorial material, because there is not one: the honest
account is that finding this needs somebody to read the text, and these make the reading cheaper
and its result permanent.

Attribution for the Spanish: _Versión Biblia Libre (VBL), Copyright © 2018–2020 Jonathan
Gallagher y Shelly Barrios de Avila, with Gustavo Sanabria and Rebekah Põldaas, licensed under
CC BY-SA 4.0 (<https://creativecommons.org/licenses/by-sa/4.0/>)._ The notice the edition itself
supplies reads "Versión Biblia Libre, Nuevo Testamento copyright © 2018-2020 Jonathan Gallagher
y Shelly Barrios de Avila", and names Gustavo Sanabria and Rebekah Põldaas as contributors. The
"Nuevo Testamento" is the upstream notice's own wording and is narrower than what the archive
holds, which is the whole Bible; the credit the app shows keeps the names, the years and the
licence and leaves that qualifier here, where it can be explained rather than repeated as if it
described the file. Modified: a space before a colon is moved
in one verse (Genesis 19:34); the other 31,101 are character-for-character the source text, and
no word is altered anywhere. ShareAlike applies to adapted material, and moving a space is not an
adaptation — CC BY-SA 4.0 §2(a)(4) says in terms that technical modification "never produces
Adapted Material" — but anyone redistributing this text must pass on the same licence, which is
the one standing obligation among the Bibles here that the public-domain ones do not carry. It
does not reach this repository's MIT-licensed code, which is not derived from the text.

The Spanish edition is also the youngest text here, and it still has rough edges of its own — a
dozen or so across 31,102 verses. Some are clauses the translators have not finished translating
(Deuteronomy 3:15 reads `Asigné el resto de Galaad to the descendants of Maquir`, Psalm 145:1
`Un salmo of David`), the rest are typos (`failia` for `familia` at Hosea 5:1, `estepueblo` at
Exodus 33:12, `con in justicia` at Amos 2:7). They are in the edition itself and in eBible's own
published pages, not introduced here, and they are deliberately left alone: they are the
translation's words, and silently correcting them would make "no word is altered" false and turn
a technical modification into an adaptation, which is the one thing CC BY-SA treats differently.
They are written down here instead, because a reader who finds English in a Spanish Bible
deserves to know it was already there. The project's own publisher calls the complete edition a
beta, and the right place for these is a report upstream.

This is the Spanish shipped instead of the Reina Valera 1909, which would have been the better
known name by far. That edition numbers its verses the Hebrew way and was never remapped, so
every machine-readable copy found — eBible's and CrossWire's SWORD module, which have the same
eighteen blank verses — files the text of six chapters one verse away from the number it belongs
to, and crams three verses of Job 39 into one slot. Repairing it would mean deciding where verses
end inside Hebrew poetry, which is not a decision this project should be making about scripture.

Attribution for the original-language words: _STEP Bible (<https://www.STEPBible.org>), based on
work at Tyndale House, Cambridge, licensed under CC BY 4.0
(<https://creativecommons.org/licenses/by/4.0/>)._ Modified: reduced to the dictionary form of each
word used in each verse, keyed to KJV verse numbering, with psalm superscriptions (which that
numbering has no slot for) left out. The 96 MB of tagged text is not committed
here: STEPBible asks that it be fetched from them rather than passed on second-hand, which is also
what `npm run data:build` does, against the pins in `../sources.json`.

Attribution for the cross-references: _Cross-reference data: OpenBible.info
(<https://www.openbible.info/labs/cross-references/>), licensed under CC BY 4.0
(<https://creativecommons.org/licenses/by/4.0/>)._ The files here are unmodified; the datasets built
from them are re-indexed to KJV verse numbering.

The MIT license of this repository's code does not apply to these files.
