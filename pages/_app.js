import '../styles/globals.css';
import InstallPrompt from '../components/InstallPrompt';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <InstallPrompt />
    </>
  );
}
