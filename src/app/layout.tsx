import './globals.css';

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <link rel='stylesheet' href='/tailwind.css' />
      </head>
      <body className='antialiased min-h-screen bg-white'>
        {children}
      </body>
    </html>
  );
}
