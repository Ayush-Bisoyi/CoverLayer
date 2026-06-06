import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border rounded-xl shadow-sm">
      <HelpCircle className="w-16 h-16 text-muted-foreground/60 mb-4" />
      <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The workspace path you requested doesn't exist or has been moved.
      </p>
      <Link to="/" className="mt-6 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg shadow hover:bg-primary/90 transition-colors">
        Go to Dashboard
      </Link>
    </div>
  );
}
