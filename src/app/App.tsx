import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { AuthContextProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthContextProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthContextProvider>
  );
}

export default App;
