import { registerLocaleData } from '@angular/common';
import localeDa from '@angular/common/locales/da';
import { LOCALE_ID, Provider } from '@angular/core';

registerLocaleData(localeDa);

export function provideDanishLocale(): Provider {
  return { provide: LOCALE_ID, useValue: 'da-DK' };
}
