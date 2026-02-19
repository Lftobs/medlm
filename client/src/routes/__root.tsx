import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'
import { ChatProvider } from '../contexts/ChatContext'


import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'MedLM - AI Medical Health Assistant',
      },
      {
        name: 'description',
        content: 'MedLM is your advanced AI-powered health assistant. Analyze medical records, track vitals, and get personalized health insights securely.',
      },
      {
        name: 'keywords',
        content: 'medical AI, health assistant, analyze medical records, vitals tracking, personalized health',
      },
      {
        property: 'og:title',
        content: 'MedLM - AI Medical Health Assistant',
      },
      {
        property: 'og:description',
        content: 'MedLM transforms your scattered medical records into an intelligent, interactive health narrative.',
      },
      {
        property: 'og:image',
        content: '/medlm-icon.svg',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/medlm-icon.svg',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ChatProvider>
          {children}
        </ChatProvider>
        <Toaster position="top-center" richColors />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
