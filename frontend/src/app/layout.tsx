import type { Metadata } from "next"
import "../../public/assets/css/bootstrap.min.css"
import "../../public/assets/css/common.css"
import "../../public/assets/css/main.css"
import "../../public/assets/css/responsive.css"
import { Providers } from "@/components/providers/Providers"

export const metadata: Metadata = {
  title: "Buddy Script",
  description: "A social media platform",
  icons: { icon: "/assets/images/logo-copy.svg" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
