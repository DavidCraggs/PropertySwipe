/**
 * Seed Data Modal Component
 * Provides UI for seeding test data with progress tracking
 */

import { useState } from 'react';
import { X, Database, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { seedAllTestData, type SeedingResult, type SeedingStepResult } from '../../utils/seedTestData';

interface SeedDataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SeedDataModal({ isOpen, onClose }: SeedDataModalProps) {
    const [isSeeding, setIsSeeding] = useState(false);
    const [result, setResult] = useState<SeedingResult | null>(null);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [clearExisting, setClearExisting] = useState(true);

    const handleSeed = async () => {
        setIsSeeding(true);
        setResult(null);
        setCurrentStep('Starting...');

        try {
            const seedResult = await seedAllTestData({
                clearExisting,
                verbose: true,
            });

            setResult(seedResult);
            setCurrentStep('');
        } catch (error) {
            setResult({
                success: false,
                steps: [],
                totalRecords: 0,
                totalDuration: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            });
            setCurrentStep('');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleClose = () => {
        if (!isSeeding) {
            setResult(null);
            setCurrentStep('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Database className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-neutral-900">Seed Test Data</h2>
                            <p className="text-sm text-neutral-600">Populate database with sample data</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSeeding}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Options */}
                    {!result && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-medium mb-1">Warning</p>
                                    <p>This will create test data in your database. Use only in development environments.</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={clearExisting}
                                    onChange={(e) => setClearExisting(e.target.checked)}
                                    disabled={isSeeding}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <div>
                                    <div className="font-medium text-neutral-900">Clear existing seed data</div>
                                    <div className="text-sm text-neutral-600">Remove all previous test data before seeding</div>
                                </div>
                            </label>

                            <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
                                <p className="text-sm font-medium text-neutral-900">This will create:</p>
                                <ul className="text-sm text-neutral-700 space-y-1 ml-4">
                                    <li>• User profiles (renters, landlords, agencies)</li>
                                    <li>• Rental properties</li>
                                    <li>• Matches and conversations</li>
                                    <li>• Viewing requests</li>
                                    <li>• Maintenance issues</li>
                                    <li>• Ratings and reviews</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {isSeeding && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                                <Loader className="w-5 h-5 text-primary-600 animate-spin flex-shrink-0" />
                                <div className="text-sm text-primary-900">
                                    <p className="font-medium">Seeding in progress...</p>
                                    {currentStep && <p className="text-primary-700">{currentStep}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className={`flex items-start gap-3 p-4 rounded-lg border ${result.success
                                    ? 'bg-success-50 border-success-200'
                                    : 'bg-danger-50 border-danger-200'
                                }`}>
                                {result.success ? (
                                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${result.success ? 'text-success-900' : 'text-danger-900'}`}>
                                        {result.success ? 'Seeding completed successfully!' : 'Seeding failed'}
                                    </p>
                                    <div className="mt-2 text-sm space-y-1">
                                        <p className={result.success ? 'text-success-800' : 'text-danger-800'}>
                                            Total records: {result.totalRecords}
                                        </p>
                                        <p className={result.success ? 'text-success-800' : 'text-danger-800'}>
                                            Duration: {(result.totalDuration / 1000).toFixed(2)}s
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step Details */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-neutral-900">Steps:</p>
                                <div className="space-y-2">
                                    {result.steps.map((step: SeedingStepResult, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${step.success
                                                    ? 'bg-neutral-50 border-neutral-200'
                                                    : 'bg-danger-50 border-danger-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {step.success ? (
                                                    <CheckCircle className="w-4 h-4 text-success-600" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-danger-600" />
                                                )}
                                                <span className="text-sm font-medium text-neutral-900">{step.name}</span>
                                            </div>
                                            <div className="text-xs text-neutral-600">
                                                {step.success ? (
                                                    <span>{step.recordsCreated} records • {step.duration}ms</span>
                                                ) : (
                                                    <span className="text-danger-600">{step.error}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Errors */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                                    <p className="text-sm font-medium text-danger-900 mb-2">Errors:</p>
                                    <ul className="text-sm text-danger-800 space-y-1">
                                        {result.errors.map((error, idx) => (
                                            <li key={idx}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
                    {!result ? (
                        <>
                            <button
                                onClick={handleClose}
                                disabled={isSeeding}
                                className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSeed}
                                disabled={isSeeding}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSeeding ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Seeding...
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4" />
                                        Start Seeding
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
