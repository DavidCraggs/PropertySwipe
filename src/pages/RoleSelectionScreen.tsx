import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { setProfileRole } from '../lib/profiles';
import type { UserType } from '../types';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserType) => void;
  onLogin: () => void;
  onBack: () => void;
}

const roles: {
  type: UserType;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    type: 'renter',
    title: 'RENTER',
    subtitle: 'Find your next home',
    description: 'Browse rental properties in Southport, Liverpool, and Manchester',
  },
  {
    type: 'landlord',
    title: 'LANDLORD',
    subtitle: 'Find the right tenant',
    description: 'Let your property and connect with vetted renters',
  },
  {
    type: 'estate_agent',
    title: 'ESTATE AGENT',
    subtitle: 'Market & connect',
    description: 'List properties and match landlords with tenants',
  },
  {
    type: 'management_agency',
    title: 'MANAGEMENT',
    subtitle: 'Manage portfolios',
    description: 'Oversee rental properties and provide tenancy support',
  },
];

/**
 * RoleSelectionScreen — Concept C design
 * Warm parchment background, monochrome role cards, Bebas Neue headings
 */
export function RoleSelectionScreen({ onSelectRole, onLogin, onBack }: RoleSelectionScreenProps) {
  const { supabaseUserId } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = async (role: UserType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Persist role to unified profiles table if authenticated via Supabase
      if (supabaseUserId) {
        await setProfileRole(supabaseUserId, role);
      }
      onSelectRole(role);
    } catch (error) {
      console.error('[RoleSelection] Failed to set role:', error);
      // Still proceed — the role can be set later
      onSelectRole(role);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s, color 0.5s',
      }}
    >
      {/* Back button */}
      <header style={{ padding: 16, zIndex: 10 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: 'var(--color-sub)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <ArrowLeft size={16} />
          BACK
        </button>
      </header>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px 24px',
          zIndex: 10,
        }}
      >
        <motion.div
          style={{ width: '100%', maxWidth: 520 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 38,
                letterSpacing: 4,
                margin: '0 0 8px',
                lineHeight: 1,
              }}
            >
              WHO ARE YOU?
            </h1>
            <p
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 13,
                color: 'var(--color-sub)',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Choose your role to get started
            </p>
          </div>

          {/* Role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {roles.map((role, index) => (
              <motion.button
                key={role.type}
                onClick={() => handleSelectRole(role.type)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + index * 0.08,
                  duration: 0.4,
                  ease: 'easeOut',
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-line)',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-teal)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-line)';
                }}
              >
                {/* Left: title + subtitle */}
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 24,
                      letterSpacing: 3,
                      margin: '0 0 2px',
                      lineHeight: 1,
                      color: 'var(--color-text)',
                    }}
                  >
                    {role.title}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-teal)',
                      margin: '0 0 4px',
                      letterSpacing: 0.5,
                    }}
                  >
                    {role.subtitle}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--color-sub)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {role.description}
                  </p>
                </div>

                {/* Right arrow */}
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 22,
                    color: 'var(--color-sub)',
                    transition: 'color 0.2s',
                  }}
                >
                  →
                </span>
              </motion.button>
            ))}
          </div>

          {/* Helper text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 11,
              color: 'var(--color-sub)',
              fontWeight: 500,
              fontStyle: 'italic',
            }}
          >
            &ldquo;Don&rsquo;t worry, you can change this later.&rdquo;
          </motion.p>

          {/* Login link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--color-line)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 12,
                color: 'var(--color-sub)',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Already have an account?{' '}
              <button
                onClick={onLogin}
                style={{
                  color: 'var(--color-teal)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
