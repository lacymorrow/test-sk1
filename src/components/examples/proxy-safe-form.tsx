"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ServerActionErrorBoundary, useDetectCorporateEnvironment } from "@/components/primitives/server-action-error-boundary";
import { ServerActionError, useServerAction, withServerActionHandling } from "@/lib/server-action-wrapper";

// Example server action (this would normally be in your server actions file)
async function exampleServerAction(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    // Simulate the action
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, randomly simulate different types of failures
    const random = Math.random();
    if (random < 0.3) {
        throw new Error("403 Forbidden - Corporate proxy blocked this request");
    } else if (random < 0.4) {
        throw new Error("Network error: Failed to fetch");
    }

    return { success: true, message: "Action completed successfully" };
}

// Fallback function for when server actions are blocked
async function fallbackAction(formData: FormData) {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    // Store data locally or use an alternative method
    const fallbackData = {
        email,
        name,
        timestamp: new Date().toISOString(),
        method: "fallback"
    };

    // Store in localStorage as a fallback
    const existingData = JSON.parse(localStorage.getItem("fallback_submissions") || "[]");
    existingData.push(fallbackData);
    localStorage.setItem("fallback_submissions", JSON.stringify(existingData));

    return {
        success: true,
        data: fallbackData,
        message: "Data saved locally. It will be synchronized when connection is restored."
    };
}

/**
 * Example form using the new server action error handling
 */
export const ProxySafeForm = () => {
    const [formData, setFormData] = useState({ email: "", name: "" });
    const [lastSuccess, setLastSuccess] = useState<any>(null);
    const { isCorporate, isChecking } = useDetectCorporateEnvironment();

    // Using the useServerAction hook for automatic error handling
    const { execute, isLoading, error, clearError } = useServerAction(
        async (formData: FormData) => await exampleServerAction(formData),
        {
            timeout: 8000, // 8 second timeout
            retries: 2,
            retryDelay: 1500,
            showToast: true,
            errorMessages: {
                proxy: "Your company's firewall blocked this request. The form data has been saved locally and will sync when possible.",
                network: "Connection issue detected. Please check your network and try again.",
                timeout: "Request timed out. This might be due to network restrictions.",
            },
            fallback: () => fallbackAction(new FormData()),
        }
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        clearError();

        const form = e.currentTarget;
        const formData = new FormData(form);

        const result = await execute(formData);

        if (result.success) {
            setLastSuccess(result.data);
            toast.success(result.data?.message || "Action completed successfully!");

            // Reset form on success
            setFormData({ email: "", name: "" });
        }
    };

    // Alternative approach: manually wrapping the server action
    const handleManualSubmit = async () => {
        clearError();

        const formData = new FormData();
        formData.append("email", formData.email);
        formData.append("name", formData.name);

        const wrappedAction = withServerActionHandling(exampleServerAction, {
            timeout: 10000,
            retries: 1,
            fallback: () => fallbackAction(formData),
            errorMessages: {
                proxy: "Corporate firewall detected. Using offline mode.",
            }
        });

        const result = await wrappedAction(formData);

        if (result.success) {
            toast.success("Manual submission successful!");
        } else if (result.errorType === ServerActionError.PROXY_BLOCKED) {
            toast.warning("Switched to offline mode due to network restrictions");
        }
    };

    return (
        <ServerActionErrorBoundary
            onError={(error, errorInfo) => {
                console.error("Form error boundary caught:", error, errorInfo);
            }}
        >
            <div className="space-y-6">
                {/* Corporate environment indicator */}
                {!isChecking && isCorporate && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-100">
                                Corporate Network Detected
                            </Badge>
                        </div>
                        <p className="text-sm text-yellow-800 mt-1">
                            Some features may be limited due to network security policies.
                            Forms will automatically fall back to offline mode if needed.
                        </p>
                    </div>
                )}

                {/* Main form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Proxy-Safe Form Example</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            This form automatically handles network restrictions and proxy blocking.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-800">{error}</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearError}
                                        className="mt-1"
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit with Auto-Handling"
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleManualSubmit}
                                    disabled={isLoading}
                                >
                                    Manual Submit
                                </Button>
                            </div>
                        </form>

                        {lastSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                        Success!
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 mt-1">
                                    {lastSuccess.message}
                                </p>
                                {lastSuccess.method === "fallback" && (
                                    <Badge variant="outline" className="mt-2 bg-blue-100">
                                        Offline Mode
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Debug info */}
                <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Debug Information</summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                        <div className="space-y-1">
                            <div><strong>Corporate Environment:</strong> {isCorporate ? "Yes" : "No"}</div>
                            <div><strong>Is Loading:</strong> {isLoading ? "Yes" : "No"}</div>
                            <div><strong>Current Error:</strong> {error || "None"}</div>
                            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                        </div>
                    </div>
                </details>
            </div>
        </ServerActionErrorBoundary>
    );
};
