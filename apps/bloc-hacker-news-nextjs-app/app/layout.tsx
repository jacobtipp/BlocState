import { Providers } from '@bloc-hn-nextjs-app/features/app/view/providers';
import '@bloc-hn-nextjs-app/features/app/view/app.css';

export const metadata = {
  title: 'Welcome to bloc-hacker-news-nextjs-app',
  description: 'Generated by create-nx-workspace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="__next">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}