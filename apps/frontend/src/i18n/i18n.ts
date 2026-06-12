import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import enOnboarding from './locales/en/onboarding.json';
import enProjects from './locales/en/projects.json';
import enSpaces from './locales/en/spaces.json';
import enTasks from './locales/en/tasks.json';
import plAuth from './locales/pl/auth.json';
import plCommon from './locales/pl/common.json';
import plErrors from './locales/pl/errors.json';
import plOnboarding from './locales/pl/onboarding.json';
import plProjects from './locales/pl/projects.json';
import plSpaces from './locales/pl/spaces.json';
import plTasks from './locales/pl/tasks.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    onboarding: enOnboarding,
    spaces: enSpaces,
    projects: enProjects,
    tasks: enTasks,
  },
  pl: {
    common: plCommon,
    auth: plAuth,
    errors: plErrors,
    onboarding: plOnboarding,
    spaces: plSpaces,
    projects: plProjects,
    tasks: plTasks,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
