"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teams } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface AccessControlProps {
    children: React.ReactNode;
}

export function AccessControl({ children }: AccessControlProps) {
    const { user } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null = not checked yet
    const [accessChecked, setAccessChecked] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            // Don't redirect on refresh - allow error state to show
            if (!user) {
                setHasAccess(false);
                setAccessChecked(true);
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

                const userHasAccess = hasSuperAdminAccess || hasAdminLabel;
                setHasAccess(userHasAccess);
            } catch (error) {
                console.error('Failed to check access:', error);
                setHasAccess(false);
            } finally {
                setAccessChecked(true);
            }
        };

        // Only check access if user exists
        if (user) {
            checkAccess();
        } else {
            // If no user, set access to false immediately
            setHasAccess(false);
            setAccessChecked(true);
        }
    }, [user]);

    // Show loading while checking access or loading translations
    // Also show loading if hasAccess is null (not checked yet) or if accessChecked is false
    if (translationLoading || !accessChecked || hasAccess === null) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {t('loading')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show access denied message only after access check is complete and access is denied
    if (accessChecked && hasAccess === false) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="flex-1">
                                {!user 
                                    ? t('community_topics_page.failed_to_load')
                                    : 'Access denied. Super Admin or Admin privileges required.'
                                }
                            </span>
                            <Button variant="outline" size="sm" onClick={() => router.push('/auth/dashboard')} className="w-full sm:w-auto">
                                <span suppressHydrationWarning>{t('back')}</span>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <>{children}</>;
}

