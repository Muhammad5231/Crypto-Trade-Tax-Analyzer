import FintechCosmicBackground from '../components/FintechCosmicBackground';

function AppShell({ children }) {
  return (
    <div className="app-shell overflow-hidden">
      <FintechCosmicBackground />
      <div className="app-shell__content relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pt-3 pb-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default AppShell;
