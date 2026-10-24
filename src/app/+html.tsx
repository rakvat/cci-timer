import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={styles.document}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <style>{`
          html, body, #root {
            min-height: 100%;
            margin: 0;
            background: #000;
          }
          html { color-scheme: dark; }
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body style={styles.document}>{children}</body>
    </html>
  );
}

const styles = {
  document: {
    backgroundColor: '#000',
  },
};
