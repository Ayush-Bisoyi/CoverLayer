import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-rose-500/20 rounded-xl shadow-sm">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
      <h2 className="text-2xl font-bold text-foreground">User Registration Required</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        Your email is not currently registered on CoverLayer. Please contact your brokerage administrator to verify your credentials.
      </p>
    </div>
  );
}
