import {
  AddToHomeScreenIcon,
  AddressBarInstallIcon,
  BrowserMenuIcon,
  DoneIcon,
  ShareIcon,
} from '../../shared/ui/icons.tsx';
import type { InstallGuides } from './types.ts';
export const slInstall: InstallGuides = {
  ios: {
    label: 'iPhone',
    steps: [
      { icon: ShareIcon, text: <>V orodni vrstici brskalnika Safari tapnite gumb za deljenje.</> },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Pomaknite se navzdol in izberite <b>Dodaj na začetni zaslon</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Tapnite <b>Dodaj</b>. Aplikacija se pojavi na začetnem zaslonu.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari to možnost vedno ponuja. Chrome, Edge in Firefox na napravah iPhone ali iPad
        uporabljajo isti meni in jo ponujajo, kadar je podprta.
      </>
    ),
  },
  android: {
    label: 'Android',
    steps: [
      { icon: BrowserMenuIcon, text: <>Odprite meni v orodni vrstici brskalnika Chrome.</> },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Izberite <b>Namesti aplikacijo</b> ali <b>Dodaj na začetni zaslon</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Potrdite z <b>Namesti</b>.
          </>
        ),
      },
    ],
  },
  desktop: {
    label: 'Računalnik',
    steps: [
      {
        icon: AddressBarInstallIcon,
        text: (
          <>V brskalniku Chrome ali Edge kliknite gumb za namestitev na koncu naslovne vrstice.</>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Izberite <b>Namesti</b>. Aplikacija se odpre v svojem oknu.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari na Macu omogoča namestitev z <b>Deli → Dodaj v Dock</b>. Firefox ne namešča spletnih
        aplikacij, vendar stran po prvem obisku deluje tudi brez povezave.
      </>
    ),
  },
};
