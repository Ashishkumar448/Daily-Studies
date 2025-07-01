import ViewerSelector from './viewerSelector';

export const metadata = {
  title: "Viewer Selector | Ashish's Portfolio",
  description: "Choose who is viewing this portfolio to tailor the experience: HR, Developer, Designer, and more.",
  keywords: ["portfolio viewer", "role selector", "Ashish portfolio", "developer viewer", "interactive UI"],
  openGraph: {
    title: "Who is viewing Ashish's Portfolio?",
    description: "A clean and animated viewer selection interface for different audiences.",
    url: "https://yourdomain.com/viewcat",
    type: "website",
    images: [
      {
        url: "https://yourdomain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ashish Portfolio Viewer Selector",
      },
    ],
  },
};

export default function ViewcatPage() {
  return <ViewerSelector />;
}
