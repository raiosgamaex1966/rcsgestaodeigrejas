
-- Add approval settings to church_settings
ALTER TABLE public.church_settings 
ADD COLUMN IF NOT EXISTS expense_approval_threshold numeric DEFAULT 500,
ADD COLUMN IF NOT EXISTS require_council_approval_above numeric DEFAULT 2000;

-- Create expense_approvals table for approval workflow
CREATE TABLE public.expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expense_entries(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id),
  requested_at timestamp with time zone DEFAULT now(),
  approval_level text NOT NULL DEFAULT 'tesoureiro',
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create financial_audit_log table for complete audit trail
CREATE TABLE public.financial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  notes text
);

-- Add approval_status to expense_entries
ALTER TABLE public.expense_entries 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Enable RLS
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_approvals
CREATE POLICY "Admins can manage expense approvals"
ON public.expense_approvals FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tesoureiros can manage approvals"
ON public.expense_approvals FOR ALL
USING (has_role(auth.uid(), 'tesoureiro'));

CREATE POLICY "Conselho can manage approvals"
ON public.expense_approvals FOR ALL
USING (has_role(auth.uid(), 'conselho'));

-- RLS Policies for financial_audit_log
CREATE POLICY "Admins can view audit log"
ON public.financial_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Conselho can view audit log"
ON public.financial_audit_log FOR SELECT
USING (has_role(auth.uid(), 'conselho'));

CREATE POLICY "System can insert audit logs"
ON public.financial_audit_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.log_financial_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.financial_audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.financial_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.financial_audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for audit logging
CREATE TRIGGER audit_income_entries
AFTER INSERT OR UPDATE OR DELETE ON public.income_entries
FOR EACH ROW EXECUTE FUNCTION public.log_financial_changes();

CREATE TRIGGER audit_expense_entries
AFTER INSERT OR UPDATE OR DELETE ON public.expense_entries
FOR EACH ROW EXECUTE FUNCTION public.log_financial_changes();

CREATE TRIGGER audit_financial_accounts
AFTER INSERT OR UPDATE OR DELETE ON public.financial_accounts
FOR EACH ROW EXECUTE FUNCTION public.log_financial_changes();

CREATE TRIGGER audit_expense_approvals
AFTER INSERT OR UPDATE OR DELETE ON public.expense_approvals
FOR EACH ROW EXECUTE FUNCTION public.log_financial_changes();

-- Update timestamp trigger
CREATE TRIGGER update_expense_approvals_updated_at
BEFORE UPDATE ON public.expense_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
