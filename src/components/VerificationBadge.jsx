import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export function VerificationBadge({ isVerified, showText = true, className }) {
    if (isVerified) {
        return (
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200", className)} title="Verified Identify via DigiLocker">
                <ShieldCheck className="h-4 w-4" />
                {showText && <span className="text-xs font-medium">Verified Donor</span>}
            </div>
        );
    }

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200", className)} title="Verification Required">
            <ShieldAlert className="h-4 w-4" />
            {showText && <span className="text-xs font-medium">Not Verified</span>}
        </div>
    );
}
