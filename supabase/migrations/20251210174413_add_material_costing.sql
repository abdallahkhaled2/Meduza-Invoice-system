/*
  # Add Material Costing

  1. Changes
    - Add `unit_cost` column to `item_materials` table to store cost per unit of material
    - Add `total_cost` column to `item_materials` table to store total cost (unit_cost * total_qty)
  
  2. Notes
    - Existing records will have default cost of 0
    - These fields track the cost of materials used in invoice items
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'item_materials' AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE item_materials ADD COLUMN unit_cost numeric(14,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'item_materials' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE item_materials ADD COLUMN total_cost numeric(14,2) DEFAULT 0;
  END IF;
END $$;