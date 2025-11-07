"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teams } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AccessControlProps {
    children: React.ReactNode;
}

export function AccessControl({ children }: AccessControlProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                router.push('/auth/dashboard');
                return;
            }

            try {
                // Check for Super Admin team membership
                let hasSuperAdminAccess = false;
                try {
                    const userTeams = await teams.list({});
                    hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin') || false;
                } catch (teamError) {
                    // If teams.list fails (CORS, permissions, etc.), continue to check admin label
                    console.warn('Failed to check teams, checking admin label:', teamError);
                }

                // Check for admin label in user object
                const userLabels = (user as any).labels || [];
                const userPrefs = (user as any).prefs || {};
                const hasAdminLabel = Array.isArray(userLabels) && userLabels.some((label: string) =>
                    label.toLowerCase() === 'admin'
                ) || userPrefs.role === 'admin' || userPrefs.label === 'admin';

                if (!hasSuperAdminAccess && !hasAdminLabel) {
                    toast.error('Access denied. Super Admin or Admin privileges required.');
                    router.push('/auth/dashboard');
                    return;
                }

                setIsSuperAdmin(hasSuperAdminAccess);
                setIsAdmin(hasAdminLabel);
            } catch (error) {
                console.error('Failed to check access:', error);
                toast.error('Failed to verify access permissions.');
                router.push('/auth/dashboard');
            } finally {
                setIsLoadingAccess(false);
            }
        };

        checkAccess();
    }, [user, router]);

    // Show loading while checking access
    if (isLoadingAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't render anything if not authorized (redirect will happen)
    if (!isSuperAdmin && !isAdmin) {
        return null;
    }

    return <>{children}</>;
}

