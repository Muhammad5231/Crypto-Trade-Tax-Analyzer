import AppErrorBoundary from './components/AppErrorBoundary';
import AppShell from './layouts/AppShell';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <AppShell>
      <AppErrorBoundary>
        <DashboardPage />
      </AppErrorBoundary>
    </AppShell>
  );
}

export default App;
