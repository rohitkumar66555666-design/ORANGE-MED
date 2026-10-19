// App entry — hash-based routing: / = role selector, #admin, #delivery
// Both dashboards share state via localStorage — open in separate tabs.

import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import RoleSelector from './components/admin/LoginView';
import AdminDashboard from './components/admin/AdminDashboard';
import DeliveryDashboard from './components/delivery/DeliveryDashboard';

function getHash() {
  return window.location.hash.replace('#', '').toLowerCase();
}

function AppContent() {
  const [route, setRoute] = useState(getHash);

  useEffect(() => {
    const onHash = () => setRoute(getHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route === 'admin') return <AdminDashboard />;
  if (route === 'delivery') return <DeliveryDashboard />;
  return <RoleSelector />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
