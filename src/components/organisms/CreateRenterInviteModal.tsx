import { useState } from 'react';
import { X, Copy, CheckCircle2, Calendar, PoundSterling } from 'lucide-react';
import { createRenterInvite } from '../../lib/storage';
import { useToastStore } from './toastUtils';
import type { Property, RenterInvite } from '../../types';

interface CreateRenterInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    landlordId: string;
    managingAgencyId?: string;
    createdByType: 'landlord' | 'management_agency' | 'estate_agent';
}

/**
 * Modal for landlords/agencies to create renter invite codes
 * Shows form for invite details, then displays generated code
 */
export function CreateRenterInviteModal({
    isOpen,
    onClose,
    property,
    landlordId,
    managingAgencyId,
    createdByType,
}: CreateRenterInviteModalProps) {
    const { addToast } = useToastStore();
    const [proposedRentPcm, setProposedRentPcm] = useState(property.rentPcm.toString());
    const [proposedDepositAmount, setProposedDepositAmount] = useState('');
    const [proposedMoveInDate, setProposedMoveInDate] = useState('');
    const [specialTerms, setSpecialTerms] = useState('');
    const [createdInvite, setCreatedInvite] = useState<RenterInvite | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const handleCreate = async () => {
        if (!proposedRentPcm || parseInt(proposedRentPcm) <= 0) {
            addToast({
                type: 'warning',
                title: 'Invalid Amount',
                message: 'Please enter a valid rent amount',
            });
            return;
        }

        setIsCreating(true);
        try {
            const invite = await createRenterInvite({
                createdById: createdByType === 'landlord' ? landlordId : managingAgencyId!,
                createdByType,
                propertyId: property.id,
                landlordId,
                managingAgencyId,
                proposedRentPcm: parseInt(proposedRentPcm),
                proposedDepositAmount: proposedDepositAmount ? parseInt(proposedDepositAmount) : undefined,
                proposedMoveInDate: proposedMoveInDate ? new Date(proposedMoveInDate) : undefined,
                specialTerms: specialTerms.trim() || undefined,
            });

            setCreatedInvite(invite);
        } catch (error) {
            console.error('[CreateRenterInviteModal] Error creating invite:', error);
            addToast({
                type: 'danger',
                title: 'Error',
                message: 'Failed to create invite. Please try again.',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyCode = async () => {
        if (createdInvite) {
            try {
                await navigator.clipboard.writeText(createdInvite.code);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } catch (error) {
                console.error('[CreateRenterInviteModal] Failed to copy:', error);
                addToast({
                    type: 'warning',
                    title: 'Copy Failed',
                    message: 'Failed to copy code. Please copy manually.',
                });
            }
        }
    };

    const handleClose = () => {
        setCreatedInvite(null);
        setCopiedCode(false);
        setProposedRentPcm(property.rentPcm.toString());
        setProposedDepositAmount('');
        setProposedMoveInDate('');
        setSpecialTerms('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 id="modal-title" className="text-2xl font-bold text-neutral-900">
                        {createdInvite ? 'Invite Created!' : 'Invite Renter'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {!createdInvite ? (
                        /* Form Screen */
                        <div className="space-y-5">
                            {/* Property Summary */}
                            <div className="p-4 bg-neutral-50 rounded-xl">
                                <p className="text-sm font-semibold text-neutral-900 mb-1">Property</p>
                                <p className="text-sm text-neutral-600">
                                    {property.address.street}, {property.address.city}
                                </p>
                                <p className="text-sm text-neutral-600">
                                    {property.bedrooms} bed • £{property.rentPcm}/mo
                                </p>
                            </div>

                            {/* Proposed Rent */}
                            <div>
                                <label htmlFor="proposed-rent" className="block text-sm font-medium text-neutral-700 mb-2">
                                    Proposed Monthly Rent <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PoundSterling className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="proposed-rent"
                                        type="number"
                                        value={proposedRentPcm}
                                        onChange={(e) => setProposedRentPcm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                                        placeholder="2500"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Deposit Amount */}
                            <div>
                                <label htmlFor="deposit-amount" className="block text-sm font-medium text-neutral-700 mb-2">
                                    Proposed Deposit Amount (optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PoundSterling className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="deposit-amount"
                                        type="number"
                                        value={proposedDepositAmount}
                                        onChange={(e) => setProposedDepositAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">Typically 5 weeks rent</p>
                            </div>

                            {/* Move-in Date */}
                            <div>
                                <label htmlFor="move-in-date" className="block text-sm font-medium text-neutral-700 mb-2">
                                    Proposed Move-in Date (optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="move-in-date"
                                        type="date"
                                        value={proposedMoveInDate}
                                        onChange={(e) => setProposedMoveInDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {/* Special Terms */}
                            <div>
                                <label htmlFor="special-terms" className="block text-sm font-medium text-neutral-700 mb-2">
                                    Special Terms (optional)
                                </label>
                                <textarea
                                    id="special-terms"
                                    value={specialTerms}
                                    onChange={(e) => setSpecialTerms(e.target.value)}
                                    placeholder="E.g., 'Pet-friendly', 'Short-term OK', etc."
                                    className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none resize-none"
                                    rows={3}
                                    maxLength={500}
                                />
                                <p className="text-xs text-neutral-500 mt-1">{specialTerms.length}/500</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-6 bg-white border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!proposedRentPcm || isCreating}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isCreating ? 'Creating...' : 'Create Invite'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Success Screen */
                        <div className="space-y-5">
                            {/* Code Display */}
                            <div className="text-center p-6 bg-success-50 rounded-2xl">
                                <CheckCircle2 className="w-16 h-16 text-success-600 mx-auto mb-4" aria-hidden="true" />
                                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Invite Code</h3>
                                <button
                                    onClick={handleCopyCode}
                                    className="inline-block cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                                    aria-label={copiedCode ? 'Code copied' : 'Click to copy code'}
                                >
                                    <div className="text-4xl font-mono font-bold tracking-widest text-primary-600 mb-2 group-hover:text-primary-700 transition-colors">
                                        {createdInvite.code}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 group-hover:text-neutral-900">
                                        {copiedCode ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-success-600" aria-hidden="true" />
                                                <span className="text-success-600">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" aria-hidden="true" />
                                                <span>Click to copy</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* Invite Details */}
                            <div className="space-y-3 p-4 bg-neutral-50 rounded-xl">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Expires:</span>
                                    <span className="font-medium text-neutral-900">
                                        {createdInvite.expiresAt.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Property:</span>
                                    <span className="font-medium text-neutral-900">{property.address.street}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Rent:</span>
                                    <span className="font-medium text-neutral-900">£{proposedRentPcm}/mo</span>
                                </div>
                                {proposedDepositAmount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Deposit:</span>
                                        <span className="font-medium text-neutral-900">£{proposedDepositAmount}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                                <p className="text-sm text-primary-900">
                                    <strong>Share this code</strong> with your renter. They'll enter it when signing up and
                                    be automatically linked to this property.
                                </p>
                            </div>

                            {/* Done Button */}
                            <button
                                onClick={handleClose}
                                className="w-full py-3 px-6 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
