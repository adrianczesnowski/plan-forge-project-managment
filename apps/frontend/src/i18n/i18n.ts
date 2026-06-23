import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enDocs from './locales/en/docs.json';
import enErrors from './locales/en/errors.json';
import enMembers from './locales/en/members.json';
import enOnboarding from './locales/en/onboarding.json';
import enProjects from './locales/en/projects.json';
import enSettings from './locales/en/settings.json';
import enSpaces from './locales/en/spaces.json';
import enTasks from './locales/en/tasks.json';
import plAuth from './locales/pl/auth.json';
import plCommon from './locales/pl/common.json';
import plDashboard from './locales/pl/dashboard.json';
import plDocs from './locales/pl/docs.json';
import plErrors from './locales/pl/errors.json';
import plMembers from './locales/pl/members.json';
import plOnboarding from './locales/pl/onboarding.json';
import plProjects from './locales/pl/projects.json';
import plSettings from './locales/pl/settings.json';
import plSpaces from './locales/pl/spaces.json';
import plTasks from './locales/pl/tasks.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    docs: enDocs,
    errors: enErrors,
    members: enMembers,
    onboarding: enOnboarding,
    spaces: enSpaces,
    projects: enProjects,
    settings: enSettings,
    tasks: enTasks,
  },
  pl: {
    common: plCommon,
    auth: plAuth,
    dashboard: plDashboard,
    docs: plDocs,
    errors: plErrors,
    members: plMembers,
    onboarding: plOnboarding,
    spaces: plSpaces,
    projects: plProjects,
    settings: plSettings,
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
