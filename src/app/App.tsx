import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { AuthContextProvider } from './contexts/AuthContext';
import { MaintenanceGate } from '../components/system/MaintenanceGate';

function App() {
  return (
    <AuthContextProvider>
      {/* Transparent provider: polls the public maintenance status and exposes it via
          useMaintenance() so the login interceptor can enforce the boundary at sign-in. */}
      <MaintenanceGate>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </MaintenanceGate>
    </AuthContextProvider>
  );
}

export default App;
