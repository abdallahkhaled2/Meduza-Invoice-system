/*
  # Add Order Class to Invoices

  1. Changes
    - Add `order_class` column to `invoices` table to store the classification (B2B or B2C)
  
  2. Notes
    - Default value is 'B2B'
    - Existing records will be set to 'B2B' by default
    - This field helps categorize invoices for business or consumer transactions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'order_class'
  ) THEN
    ALTER TABLE invoices ADD COLUMN order_class text DEFAULT 'B2B';
  END IF;
END $$;