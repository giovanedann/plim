-- Seed default categories (user_id = NULL means system default)
INSERT INTO public.category (user_id, name, icon, color) VALUES
  (NULL, 'Alimentação', 'utensils', '#22c55e'),
  (NULL, 'Transporte', 'car', '#3b82f6'),
  (NULL, 'Moradia', 'home', '#8b5cf6'),
  (NULL, 'Saúde', 'heart-pulse', '#ef4444'),
  (NULL, 'Lazer', 'gamepad-2', '#f59e0b'),
  (NULL, 'Educação', 'graduation-cap', '#06b6d4'),
  (NULL, 'Compras', 'shopping-bag', '#ec4899'),
  (NULL, 'Outros', 'ellipsis', '#6b7280');
