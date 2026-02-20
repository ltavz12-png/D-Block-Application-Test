'use client';

import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { adminTheme } from '@/constants/theme';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>D Block Admin</title>
        <meta name="description" content="D Block Workspace Admin Panel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ConfigProvider theme={adminTheme}>
              <AntApp>{children}</AntApp>
            </ConfigProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </body>
    </html>
  );
}
