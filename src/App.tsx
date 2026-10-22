import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { LogoUploaderModal } from './components/layout/LogoUploaderModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { ConnectScreen } from './components/screens/ConnectScreen';
import { NavigateScreen } from './components/screens/NavigateScreen';
import { SafeScreen } from './components/screens/SafeScreen';
import { PayScreen } from './components/screens/PayScreen';
import { ShareScreen } from './components/screens/ShareScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

const MainContent: React.FC = () => {
  const { currentScreen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'connect':
        return <ConnectScreen />;
      case 'navigate':
        return <NavigateScreen />;
      case 'safe':
      case 'save':
        return <SafeScreen />;
      case 'pay':
        return <PayScreen />;
      case 'share':
        return <ShareScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {renderScreen()}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      <LogoUploaderModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
