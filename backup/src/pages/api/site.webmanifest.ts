import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    name: "Amica",
    short_name: "Amica",
    icons: [
      {
        src: "/amica/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/amica/android-chrome-384x384.png",
        sizes: "384x384",
        type: "image/png"
      }
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/amica/"
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.status(200).json(manifest);
} 