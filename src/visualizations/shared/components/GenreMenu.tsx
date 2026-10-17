import { t } from '../../../locales/ui.ts';
import { GenresIcon } from '../../../shared/ui/icons.tsx';
import { GenreToggles, type GenreTogglesProps } from './GenreToggles.tsx';
import { MenuButton } from './MenuButton.tsx';

/** The genre legend as a header menu, for views that label genres directly (e.g. a spine). */
export function GenreMenu(props: GenreTogglesProps) {
  return (
    <MenuButton label={t('Genres')} icon={GenresIcon} indicator={props.hiddenGenres.size > 0}>
      <GenreToggles {...props} />
    </MenuButton>
  );
}
