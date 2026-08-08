import './globals.css'
import type { Metadata } from 'next'
import NavBar from './NavBar'

export const metadata: Metadata = {
  title: 'zjewl - Production Ticket Platform',
  description: 'Jewelry Manufacturing Workflow Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <NavBar />
        <main className="app-main fade-in">{children}</main>
      </body>
    </html>
  )
}
