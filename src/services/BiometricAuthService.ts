/**
 * Biometric Authentication Service
 *
 * Provides WebAuthn-based biometric authentication for secure login.
 * Supports fingerprint, Face ID, and security keys.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'security_key' | 'unknown';

export interface BiometricCredential {
  id: string;
  credentialId: string;
  userId: string;
  type: BiometricType;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
  publicKey: string;
}

export interface BiometricCapabilities {
  isSupported: boolean;
  isPlatformAuthenticator: boolean;
  isUserVerifying: boolean;
  availableTypes: BiometricType[];
}

export interface RegistrationResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  userId?: string;
  error?: string;
}

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export class BiometricAuthService {
  private rpId: string;
  private rpName: string;

  constructor() {
    this.rpId = window.location.hostname;
    this.rpName = 'PropertySwipe';
  }

  // =====================================================
  // CAPABILITY DETECTION
  // =====================================================

  async getCapabilities(): Promise<BiometricCapabilities> {
    const result: BiometricCapabilities = {
      isSupported: false,
      isPlatformAuthenticator: false,
      isUserVerifying: false,
      availableTypes: [],
    };

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      return result;
    }

    result.isSupported = true;

    try {
      // Check for platform authenticator (built-in biometrics)
      result.isPlatformAuthenticator =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      // Check for user verification capability
      result.isUserVerifying = result.isPlatformAuthenticator;

      // Determine available types based on platform
      if (result.isPlatformAuthenticator) {
        const userAgent = navigator.userAgent.toLowerCase();

        if (/iphone|ipad/.test(userAgent)) {
          result.availableTypes.push('face'); // Face ID
          result.availableTypes.push('fingerprint'); // Touch ID
        } else if (/android/.test(userAgent)) {
          result.availableTypes.push('fingerprint');
          result.availableTypes.push('face');
        } else if (/mac/.test(userAgent)) {
          result.availableTypes.push('fingerprint'); // Touch ID
        } else if (/windows/.test(userAgent)) {
          result.availableTypes.push('face'); // Windows Hello
          result.availableTypes.push('fingerprint');
        }
      }

      // Security keys are always an option if WebAuthn is supported
      result.availableTypes.push('security_key');
    } catch (err) {
      console.error('Error checking biometric capabilities:', err);
    }

    return result;
  }

  isSupported(): boolean {
    return !!window.PublicKeyCredential;
  }

  // =====================================================
  // CREDENTIAL REGISTRATION
  // =====================================================

  async register(
    userId: string,
    userName: string,
    credentialName: string = 'My Device'
  ): Promise<RegistrationResult> {
    if (!this.isSupported()) {
      return { success: false, error: 'WebAuthn not supported' };
    }

    try {
      // Generate challenge from server
      const challenge = await this.generateChallenge(userId);

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: this.base64ToBuffer(challenge),
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        user: {
          id: this.stringToBuffer(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      // Create credential
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, error: 'Credential creation cancelled' };
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract public key
      const publicKey = this.bufferToBase64(response.getPublicKey() || new ArrayBuffer(0));
      const credentialId = this.bufferToBase64(credential.rawId);

      // Detect biometric type
      const biometricType = await this.detectBiometricType();

      // Store credential in database
      const storedCredential = await this.storeCredential({
        credentialId,
        userId,
        publicKey,
        type: biometricType,
        name: credentialName,
      });

      return { success: true, credential: storedCredential };
    } catch (err) {
      console.error('Biometric registration failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      };
    }
  }

  // =====================================================
  // CREDENTIAL AUTHENTICATION
  // =====================================================

  async authenticate(userId?: string): Promise<AuthenticationResult> {
    if (!this.isSupported()) {
      return { success: false, error: 'WebAuthn not supported' };
    }

    try {
      // Get stored credentials for user (or all if discoverable)
      const allowCredentials = userId
        ? await this.getAllowCredentials(userId)
        : [];

      // Generate challenge
      const challenge = await this.generateChallenge(userId || 'anonymous');

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: this.base64ToBuffer(challenge),
        rpId: this.rpId,
        allowCredentials:
          allowCredentials.length > 0
            ? allowCredentials.map((c) => ({
                id: this.base64ToBuffer(c.credentialId),
                type: 'public-key' as const,
                transports: ['internal' as const],
              }))
            : undefined,
        userVerification: 'required',
        timeout: 60000,
      };

      // Get credential
      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, error: 'Authentication cancelled' };
      }

      const credentialId = this.bufferToBase64(credential.rawId);

      // Verify credential and get user
      const verifiedUserId = await this.verifyCredential(credentialId, challenge);

      if (!verifiedUserId) {
        return { success: false, error: 'Invalid credential' };
      }

      // Update last used timestamp
      await this.updateLastUsed(credentialId);

      return { success: true, userId: verifiedUserId };
    } catch (err) {
      console.error('Biometric authentication failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Authentication failed',
      };
    }
  }

  // =====================================================
  // CREDENTIAL MANAGEMENT
  // =====================================================

  async getCredentials(userId: string): Promise<BiometricCredential[]> {
    const { data, error } = await supabase
      .from('biometric_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch credentials:', error);
      return [];
    }

    return (data || []).map((c) => ({
      id: c.id,
      credentialId: c.credential_id,
      userId: c.user_id,
      type: c.type,
      name: c.name,
      createdAt: new Date(c.created_at),
      lastUsedAt: c.last_used_at ? new Date(c.last_used_at) : undefined,
      publicKey: c.public_key,
    }));
  }

  async deleteCredential(credentialId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('biometric_credentials')
      .delete()
      .eq('credential_id', credentialId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete credential:', error);
      return false;
    }

    return true;
  }

  async renameCredential(
    credentialId: string,
    userId: string,
    newName: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('biometric_credentials')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('credential_id', credentialId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to rename credential:', error);
      return false;
    }

    return true;
  }

  // =====================================================
  // PRIVATE HELPERS
  // =====================================================

  private async generateChallenge(userId: string): Promise<string> {
    // In production, this should come from the server
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const challenge = this.bufferToBase64(array.buffer);

    // Store challenge temporarily for verification
    sessionStorage.setItem(`biometric_challenge_${userId}`, challenge);

    return challenge;
  }

  private async storeCredential(data: {
    credentialId: string;
    userId: string;
    publicKey: string;
    type: BiometricType;
    name: string;
  }): Promise<BiometricCredential> {
    const { data: stored, error } = await supabase
      .from('biometric_credentials')
      .insert({
        credential_id: data.credentialId,
        user_id: data.userId,
        public_key: data.publicKey,
        type: data.type,
        name: data.name,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to store credential');
    }

    return {
      id: stored.id,
      credentialId: stored.credential_id,
      userId: stored.user_id,
      type: stored.type,
      name: stored.name,
      createdAt: new Date(stored.created_at),
      publicKey: stored.public_key,
    };
  }

  private async getAllowCredentials(userId: string): Promise<BiometricCredential[]> {
    return this.getCredentials(userId);
  }

  private async verifyCredential(
    credentialId: string,
    _challenge: string
  ): Promise<string | null> {
    // In production, verify signature against stored public key
    const { data, error } = await supabase
      .from('biometric_credentials')
      .select('user_id')
      .eq('credential_id', credentialId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.user_id;
  }

  private async updateLastUsed(credentialId: string): Promise<void> {
    await supabase
      .from('biometric_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credentialId);
  }

  private async detectBiometricType(): Promise<BiometricType> {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad/.test(userAgent)) {
      // iOS devices - could be Face ID or Touch ID
      // Face ID devices have specific screen sizes
      const hasNotch = window.screen.height >= 812 && window.devicePixelRatio >= 3;
      return hasNotch ? 'face' : 'fingerprint';
    }

    if (/android/.test(userAgent)) {
      return 'fingerprint'; // Most common on Android
    }

    if (/mac/.test(userAgent)) {
      return 'fingerprint'; // Touch ID
    }

    if (/windows/.test(userAgent)) {
      return 'face'; // Windows Hello typically uses face
    }

    return 'unknown';
  }

  // =====================================================
  // BUFFER UTILITIES
  // =====================================================

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private stringToBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const biometricAuthService = new BiometricAuthService();
export default biometricAuthService;
