# Telegram Audio Player Mini App

A modern audio player built as a Telegram Mini App with tempo control, built with Next.js and Tailwind CSS.

## Features

- Play/Pause audio tracks
- Next/Previous track navigation
- Tempo control slider (50% - 200%)
- Progress bar with seek functionality
- Beautiful UI with album art
- Responsive design that works on mobile and desktop
- Ready for deployment on Vercel

## Getting Started

### Prerequisites

- Node.js 14.6.0 or later
- npm or yarn
- A Telegram account for testing

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn
```

### Running Locally

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
# or
yarn build
```

## Deployment

### Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com) from the creators of Next.js.

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Import your project into Vercel
3. Vercel will automatically detect it's a Next.js app and set up the build settings
4. Deploy!

### Telegram Mini App Setup

To use this as a Telegram Mini App:

1. Deploy your app to a public URL (e.g., Vercel)
2. Create a bot using [@BotFather](https://t.me/botfather) on Telegram
3. Use [@BotFather](https://t.me/botfather) to set up the menu button with your app's URL
4. Test your app within the Telegram app

## Built With

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [React Icons](https://react-icons.github.io/react-icons/) - Popular icons for React
- [Vercel](https://vercel.com/) - Cloud platform for static sites and Serverless Functions

## License

This project is open source and available under the [MIT License](LICENSE).
