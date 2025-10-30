import { motion } from 'framer-motion';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { UserType } from '../types';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserType) => void;
  onBack: () => void;
}

/**
 * Role selection screen for users to choose between buyer or vendor
 * Clean, centered layout with large tappable cards
 */
export function RoleSelectionScreen({ onSelectRole, onBack }: RoleSelectionScreenProps) {
  const roles = [
    {
      type: 'buyer' as UserType,
      icon: ShoppingBag,
      title: "I'm a Buyer",
      description: 'Looking for your next home in Southport, Liverpool, or Manchester',
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
    },
    {
      type: 'vendor' as UserType,
      icon: Home,
      title: "I'm a Vendor",
      description: 'Selling your property and want to find the right buyer',
      gradient: 'from-secondary-500 to-secondary-600',
      bgGradient: 'from-secondary-50 to-secondary-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
              How can we help you?
            </h1>
            <p className="text-lg text-neutral-600">
              Choose your role to get started with Get On
            </p>
          </motion.div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {roles.map((role, index) => (
              <motion.button
                key={role.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectRole(role.type)}
                className="group relative text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200/50 to-neutral-300/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={`relative bg-gradient-to-br ${role.bgGradient} rounded-3xl p-8 border-2 border-transparent group-hover:border-neutral-200 transition-all shadow-lg group-hover:shadow-xl`}>
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <role.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                    {role.title}
                  </h2>
                  <p className="text-neutral-700 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-6 flex items-center gap-2 text-neutral-900 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Continue</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Helper Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-sm text-neutral-500"
          >
            Don't worry, you can change this later
          </motion.p>
        </div>
      </main>
    </div>
  );
}
