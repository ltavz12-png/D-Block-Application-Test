const useTranslation = jest.fn(() => ({
  t: (key: string) => key,
  i18n: {
    language: 'en',
    changeLanguage: jest.fn(),
    exists: jest.fn(() => true),
  },
}));

const Trans = ({ children }: { children: React.ReactNode }) => children;

const initReactI18next = {
  type: '3rdParty',
  init: jest.fn(),
};

export { useTranslation, Trans, initReactI18next };
