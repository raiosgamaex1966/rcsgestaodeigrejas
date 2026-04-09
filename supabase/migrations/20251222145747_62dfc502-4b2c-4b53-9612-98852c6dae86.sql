
-- Tabela de Contas/Caixas Financeiros
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank', -- bank, cash, digital
  description TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Categorias Financeiras
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- income, expense
  icon TEXT DEFAULT 'CircleDollarSign',
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Entradas (Receitas)
CREATE TABLE public.income_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.financial_categories(id),
  account_id UUID REFERENCES public.financial_accounts(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  user_id UUID, -- contribuidor, se logado
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'pix', -- pix, cash, card, transfer, boleto
  contributor_name TEXT,
  contributor_email TEXT,
  contributor_phone TEXT,
  description TEXT,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Saídas (Despesas)
CREATE TABLE public.expense_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.financial_categories(id),
  account_id UUID REFERENCES public.financial_accounts(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_method TEXT DEFAULT 'pix',
  supplier_name TEXT,
  description TEXT NOT NULL,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_day INTEGER,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
  paid_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

-- Policies para financial_accounts
CREATE POLICY "Admins can manage financial accounts" ON public.financial_accounts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financial accounts viewable by authenticated" ON public.financial_accounts
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Policies para financial_categories
CREATE POLICY "Admins can manage financial categories" ON public.financial_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financial categories viewable by everyone" ON public.financial_categories
  FOR SELECT USING (is_active = true);

-- Policies para income_entries
CREATE POLICY "Admins can manage income entries" ON public.income_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own contributions" ON public.income_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Policies para expense_entries
CREATE POLICY "Admins can manage expense entries" ON public.expense_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_entries_updated_at
  BEFORE UPDATE ON public.income_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_entries_updated_at
  BEFORE UPDATE ON public.expense_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão de RECEITA
INSERT INTO public.financial_categories (name, type, icon, color, is_default, order_index) VALUES
  ('Dízimos', 'income', 'Church', '#10b981', true, 1),
  ('Ofertas', 'income', 'Heart', '#6366f1', true, 2),
  ('Ofertas Missionárias', 'income', 'Globe', '#f59e0b', true, 3),
  ('Campanhas', 'income', 'Target', '#ec4899', true, 4),
  ('Eventos', 'income', 'Calendar', '#8b5cf6', true, 5),
  ('Doações Avulsas', 'income', 'Gift', '#06b6d4', true, 6),
  ('Venda de Materiais', 'income', 'Book', '#84cc16', true, 7);

-- Inserir categorias padrão de DESPESA
INSERT INTO public.financial_categories (name, type, icon, color, is_default, order_index) VALUES
  ('Aluguel', 'expense', 'Home', '#ef4444', true, 1),
  ('Água', 'expense', 'Droplet', '#3b82f6', true, 2),
  ('Luz', 'expense', 'Zap', '#fbbf24', true, 3),
  ('Internet', 'expense', 'Wifi', '#8b5cf6', true, 4),
  ('Manutenção', 'expense', 'Wrench', '#f97316', true, 5),
  ('Salários / Ajuda de Custo', 'expense', 'Users', '#ec4899', true, 6),
  ('Missões', 'expense', 'Globe', '#10b981', true, 7),
  ('Eventos', 'expense', 'Calendar', '#6366f1', true, 8),
  ('Marketing', 'expense', 'Megaphone', '#f43f5e', true, 9),
  ('Obras / Reforma', 'expense', 'HardHat', '#78716c', true, 10),
  ('Ação Social', 'expense', 'HeartHandshake', '#14b8a6', true, 11),
  ('Materiais de Escritório', 'expense', 'FileText', '#64748b', true, 12),
  ('Limpeza', 'expense', 'Sparkles', '#a855f7', true, 13),
  ('Transporte', 'expense', 'Car', '#0ea5e9', true, 14),
  ('Alimentação', 'expense', 'UtensilsCrossed', '#f59e0b', true, 15);

-- Inserir conta padrão (Caixa Geral)
INSERT INTO public.financial_accounts (name, type, description, is_default, is_active) VALUES
  ('Caixa Geral', 'cash', 'Caixa principal da igreja', true, true);
