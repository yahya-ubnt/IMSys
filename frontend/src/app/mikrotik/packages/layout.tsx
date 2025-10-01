import React from 'react';

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* You can add shared UI here, like a sidebar or header specific to Packages */}
      {children}
    </section>
  );
}
