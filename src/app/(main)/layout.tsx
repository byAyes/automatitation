'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransitionProvider, usePageTransition, getPageVariants } from '@/lib/page-transitions';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <PageTransitionProvider>
      <InnerLayout
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
        onMobileClose={() => setMobileOpen(false)}
      >
        {children}
      </InnerLayout>
    </PageTransitionProvider>
  );
}

function InnerLayout({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileToggle,
  onMobileClose,
  children,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onMobileClose: () => void;
  children: React.ReactNode;
}) {
  const { direction, transitionKey } = usePageTransition();
  const variants = getPageVariants(direction);

  return (
    <div className="flex min-h-screen mobile-nav-spacer">
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
      />
      <div
        className="flex flex-1 flex-col transition-all duration-300 lg:ml-0"
        style={{ marginLeft: collapsed ? 60 : 240 }}
      >
        <Header onMobileToggle={onMobileToggle} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={transitionKey}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
