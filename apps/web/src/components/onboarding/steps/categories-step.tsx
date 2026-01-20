import {
  Car,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  ShoppingBag,
  Tags,
  Utensils,
} from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding-step'

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: Utensils, color: 'text-orange-400' },
  { name: 'Transporte', icon: Car, color: 'text-blue-400' },
  { name: 'Moradia', icon: Home, color: 'text-amber-400' },
  { name: 'Saúde', icon: Heart, color: 'text-red-400' },
  { name: 'Lazer', icon: Gamepad2, color: 'text-purple-400' },
  { name: 'Educação', icon: GraduationCap, color: 'text-cyan-400' },
  { name: 'Compras', icon: ShoppingBag, color: 'text-pink-400' },
  { name: 'Outros', icon: MoreHorizontal, color: 'text-slate-400' },
]

export function CategoriesStep() {
  return (
    <OnboardingStep
      icon={<Tags className="h-20 w-20" />}
      iconColorClass="text-purple-500"
      title="Organize por categorias"
      description="Já criamos categorias essenciais para você: Alimentação, Transporte, Moradia e mais. Depois, você pode criar as suas próprias."
    >
      <div className="grid grid-cols-4 gap-2 mt-4">
        {DEFAULT_CATEGORIES.map((category, index) => {
          const Icon = category.icon
          return (
            <motion.div
              key={category.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              <Icon className={`h-6 w-6 ${category.color}`} />
              <span className="text-xs text-slate-300 text-center leading-tight">
                {category.name}
              </span>
            </motion.div>
          )
        })}
      </div>
    </OnboardingStep>
  )
}
