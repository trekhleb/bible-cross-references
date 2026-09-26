# Raw data

Unmodified copies of the upstream files the app is built from. They are committed so that the site
can always be rebuilt, even if an upstream URL changes or disappears. `../sources.json` pins each
file by SHA-256, and `npm run data:build` turns them into the datasets in `public/data/`.

| File                             | Source                                                                                                                                                               | License                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `bsb.txt`                        | [Berean Standard Bible](https://berean.bible/), from <https://bereanbible.com/bsb.txt>, retrieved 2026-09-25                                                         | Public domain ("dedicated to the public domain", per the file) |
| `openbible-cross-references.zip` | [OpenBible.info cross-references](https://www.openbible.info/labs/cross-references/), from <https://a.openbible.info/data/cross-references.zip>, snapshot 2026-09-21 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)      |

Attribution for the cross-references: _Cross-reference data: OpenBible.info
(<https://www.openbible.info/labs/cross-references/>), licensed under CC BY 4.0
(<https://creativecommons.org/licenses/by/4.0/>)._ The files here are unmodified; the datasets built
from them are re-indexed to KJV verse numbering.

The MIT license of this repository's code does not apply to these files.
