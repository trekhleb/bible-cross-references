import {
  AddToHomeScreenIcon,
  AddressBarInstallIcon,
  BrowserMenuIcon,
  DoneIcon,
  ShareIcon,
} from '../../shared/ui/icons.tsx';
import type { InstallGuides } from './types.ts';

/**
 * The install steps in Polish.
 *
 * The bold words are the names those buttons wear in a Polish-language browser, not
 * translations of the English ones: Apple's Polish says «Do ekranu początkowego» and Google's
 * Chrome says «Zainstaluj aplikację», so those are what a reader following these will see.
 */
export const plInstall: InstallGuides = {
  ios: {
    label: 'iPhone',
    steps: [
      { icon: ShareIcon, text: <>Stuknij przycisk „Udostępnij” na pasku Safari.</> },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Przewiń w dół i wybierz <b>Do ekranu początkowego</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Stuknij <b>Dodaj</b>. Aplikacja pojawi się obok innych na ekranie początkowym.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari zawsze to oferuje. Chrome, Edge i Firefox na iPhonie lub iPadzie korzystają z tego
        samego menu i oferują to tam, gdzie je obsługują.
      </>
    ),
  },
  android: {
    label: 'Android',
    steps: [
      { icon: BrowserMenuIcon, text: <>Otwórz menu na pasku Chrome.</> },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Wybierz <b>Zainstaluj aplikację</b> albo <b>Dodaj do ekranu głównego</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Potwierdź, wybierając <b>Zainstaluj</b>.
          </>
        ),
      },
    ],
  },
  desktop: {
    label: 'Komputer',
    steps: [
      {
        icon: AddressBarInstallIcon,
        text: <>W Chrome lub Edge kliknij przycisk instalacji na końcu paska adresu.</>,
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Wybierz <b>Zainstaluj</b>. Aplikacja otworzy się we własnym oknie.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari na Macu instaluje przez <b>Udostępnij → Dodaj do Docka</b>. Firefox nie instaluje
        aplikacji internetowych, ale i tam strona działa offline, gdy raz ją otworzysz.
      </>
    ),
  },
};
