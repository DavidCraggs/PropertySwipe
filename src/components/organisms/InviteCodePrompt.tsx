import { useState } from 'react';
import { UserPlus, KeyRound, ArrowRight, AlertCircle, CheckCircle2, Home, Loader2 } from 'lucide-react';
import { validateInviteCode } from '../../lib/storage';
import type { InviteValidationResult } from '../../types';

interface InviteCodePromptProps {
    onContinueAsNew: () => void;
    onContinueWithInvite: (validation: InviteValidationResult) => void;
}

/**
 * Initial fork in renter onboarding flow
 * Allows renters to choose between new account or invite code path
 */
export function InviteCodePrompt({ onContinueAsNew, onContinueWithInvite }: InviteCodePromptProps) {
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validation, setValidation] = useState<InviteValidationResult | null>(null);

    const handleValidateCode = async () => {
        if (code.trim().length !== 8) {
            setValidation({ isValid: false, error: 'not_found' });
            return;
        }

        setIsValidating(true);
        try {
            const result = await validateInviteCode(code);
            setValidation(result);

            if (result.isValid) {
                // Auto-continue after 1.5s to show success
                setTimeout(() => {
                    onContinueWithInvite(result);
                }, 1500);
            }
        } catch (error) {
            console.error('[InviteCodePrompt] Validation error:', error);
            setValidation({ isValid: false, error: 'not_found' });
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (value: string) => {
        // Only allow uppercase alphanumeric, max 8 characters
        const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setCode(formatted);
        setValidation(null); // Clear validation on change
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length === 8 && !isValidating) {
            handleValidateCode();
        }
    };

    const getErrorMessage = (error?: string) => {
        switch (error) {
            case 'not_found':
                return 'Invite code not found. Please check and try again.';
            case 'expired':
                return 'This invite code has expired. Contact your landlord for a new one.';
            case 'already_used':
                return 'This invite code has already been used.';
            case 'revoked':
                return 'This invite code has been revoked.';
            default:
                return 'Invalid invite code.';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-3">Welcome to GetOn</h1>
                    <p className="text-lg text-neutral-600">Let's get you set up</p>
                </div>

                {!showCodeInput ? (
                    /* Initial Choice Screen */
                    <div className="space-y-4" role="group" aria-label="Onboarding options">
                        {/* Option 1: I have an invite code */}
                        <button
                            onClick={() => setShowCodeInput(true)}
                            className="w-full p-6 bg-white rounded-2xl border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            aria-label="Continue with invite code"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors"
                                    aria-hidden="true"
                                >
                                    <KeyRound className="w-7 h-7 text-primary-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                                        I have an invite code
                                    </h3>
                                    <p className="text-sm text-neutral-600">
                                        From a landlord or letting agent
                                    </p>
                                </div>
                                <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
                            </div>
                        </button>

                        {/* Option 2: I'm a new renter */}
                        <button
                            onClick={onContinueAsNew}
                            className="w-full p-6 bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            aria-label="Continue as new renter"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors"
                                    aria-hidden="true"
                                >
                                    <UserPlus className="w-7 h-7 text-neutral-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                                        I'm a new renter
                                    </h3>
                                    <p className="text-sm text-neutral-600">
                                        Browse and search for properties
                                    </p>
                                </div>
                                <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-600 transition-colors" aria-hidden="true" />
                            </div>
                        </button>
                    </div>
                ) : (
                    /* Code Input Screen */
                    <div className="bg-white rounded-2xl border-2 border-primary-200 p-6">
                        {/* Back Button */}
                        <button
                            onClick={() => {
                                setShowCodeInput(false);
                                setCode('');
                                setValidation(null);
                            }}
                            className="text-sm text-neutral-600 hover:text-neutral-900 mb-6 focus:outline-none focus:underline"
                            aria-label="Go back to options"
                        >
                            ← Back
                        </button>

                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Enter Invite Code</h2>
                        <p className="text-neutral-600 mb-6">Enter the 8-character code from your landlord</p>

                        <div className="space-y-4">
                            {/* Code Input */}
                            <div>
                                <label htmlFor="invite-code" className="sr-only">
                                    Invite code
                                </label>
                                <input
                                    id="invite-code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="AB12CD34"
                                    maxLength={8}
                                    className="w-full px-4 py-3 text-2xl font-mono text-center tracking-widest border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none uppercase disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                    disabled={isValidating}
                                    aria-describedby={validation && !validation.isValid ? 'code-error' : undefined}
                                    autoFocus
                                />
                            </div>

                            {/* Error Message */}
                            {validation && !validation.isValid && (
                                <div
                                    id="code-error"
                                    className="flex items-start gap-3 p-4 bg-danger-50 border border-danger-200 rounded-xl"
                                    role="alert"
                                >
                                    <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-sm text-danger-700">{getErrorMessage(validation.error)}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {validation?.isValid && validation.property && (
                                <div
                                    className="flex items-start gap-3 p-4 bg-success-50 border border-success-200 rounded-xl"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-success-900 mb-1">Valid invite!</p>
                                        <div className="flex items-center gap-2 text-sm text-success-700">
                                            <Home className="w-4 h-4" aria-hidden="true" />
                                            <span>
                                                {validation.property.address.street}, {validation.property.address.city}
                                                {' • '}
                                                {validation.property.bedrooms} bed
                                                {' • '}
                                                £{validation.property.rentPcm}/mo
                                            </span>
                                        </div>
                                        <p className="text-xs text-success-600 mt-1">Redirecting...</p>
                                    </div>
                                </div>
                            )}

                            {/* Validate Button */}
                            <button
                                onClick={handleValidateCode}
                                disabled={code.length !== 8 || isValidating}
                                className="w-full py-3 px-6 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                aria-label={isValidating ? 'Validating code' : 'Validate invite code'}
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                        <span>Validating...</span>
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
