import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { PointsEngineView } from './components/PointsEngineView';
import { RewardsView } from './components/RewardsView';
import { TiersView } from './components/TiersView';
import { ReferralsView } from './components/ReferralsView';
import { CampaignsView } from './components/CampaignsView';
import { BranchesView } from './components/BranchesView';
import { AnalyticsView } from './components/AnalyticsView';
import { CustomerPortal } from './components/CustomerPortal';
import { QuickRecordPurchaseModal } from './components/QuickRecordPurchaseModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { loyaltyService } from './services/loyaltyService';

function MainApp() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_sophia_chen');
  const [showQuickPurchaseModal, setShowQuickPurchaseModal] = useState<boolean>(false);
  const [quickPurchaseCustId, setQuickPurchaseCustId] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [, setTick] = useState(0);

  // Subscribe to loyaltyService updates
  useEffect(() => {
    const unsub = loyaltyService.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    // Also pull latest from Firestore if available
    loyaltyService.pullFromFirestore();
    return () => unsub();
  }, []);

  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSeedDemoData = async () => {
    const res = await loyaltyService.seedDemoDataToFirestore();
    showToast(
      'Demo Dataset Refreshed',
      `Restored sample data (${res.count} records) across all VIP tiers, transactions, and rewards.`,
      'success'
    );
  };

  const handleQuickRecordPurchase = (customerId?: string) => {
    setQuickPurchaseCustId(customerId);
    setShowQuickPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950">
      {/* Top App Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onQuickRecordPurchase={() => handleQuickRecordPurchase()}
        onSeedDemoData={handleSeedDemoData}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar (hidden in standalone customer portal mode) */}
        {activeView !== 'portal' && (
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenRecordPurchase={() => handleQuickRecordPurchase()}
              onOpenAddCustomer={() => {
                setActiveView('customers');
              }}
              onOpenCreateReward={() => {
                setActiveView('rewards');
              }}
              onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'customers' && (
            <CustomersView
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={(cId) => setSelectedCustomerId(cId)}
              onRecordPurchaseForCustomer={(cId) => handleQuickRecordPurchase(cId)}
              onShowToast={showToast}
            />
          )}

          {activeView === 'points-engine' && (
            <PointsEngineView
              preselectedCustomerId={selectedCustomerId}
              onShowToast={showToast}
            />
          )}

          {activeView === 'rewards' && <RewardsView onShowToast={showToast} />}

          {activeView === 'tiers' && <TiersView onShowToast={showToast} />}

          {activeView === 'referrals' && <ReferralsView onShowToast={showToast} />}

          {activeView === 'campaigns' && <CampaignsView onShowToast={showToast} />}

          {activeView === 'branches' && <BranchesView onShowToast={showToast} />}

          {activeView === 'analytics' && <AnalyticsView onShowToast={showToast} />}

          {activeView === 'portal' && (
            <CustomerPortal
              onShowToast={showToast}
              onExitPortal={() => setActiveView('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Global Quick POS Purchase Modal */}
      <QuickRecordPurchaseModal
        isOpen={showQuickPurchaseModal}
        onClose={() => setShowQuickPurchaseModal(false)}
        customerId={quickPurchaseCustId}
        onShowToast={showToast}
      />

      {/* Toast System */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
