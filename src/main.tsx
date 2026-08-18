import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { FinanceProvider } from './app/FinanceProvider';
import './styles/global.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
);
