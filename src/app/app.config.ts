import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideDanishLocale } from './locale';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideDanishLocale()],
};
