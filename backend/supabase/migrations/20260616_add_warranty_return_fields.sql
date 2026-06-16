-- Add warranty and return tracking columns to receipts table
-- All columns are optional — users can ignore them if not needed

ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS warranty_duration   TEXT,       -- e.g. "2 years", "90 days"
  ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE,      -- calculated: receipt_date + warranty_duration
  ADD COLUMN IF NOT EXISTS return_period       TEXT,       -- e.g. "14 days", "30 days"
  ADD COLUMN IF NOT EXISTS return_expiry_date  DATE,       -- calculated: receipt_date + return_period
  ADD COLUMN IF NOT EXISTS warranty_notes      TEXT,       -- free-text notes about warranty/return terms
  ADD COLUMN IF NOT EXISTS extracted_by_gemini BOOLEAN DEFAULT FALSE;  -- true when AI extracted these

-- Index for quickly finding expiring warranties and returns
CREATE INDEX IF NOT EXISTS idx_receipts_warranty_expiry
  ON receipts (warranty_expiry_date)
  WHERE warranty_expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receipts_return_expiry
  ON receipts (return_expiry_date)
  WHERE return_expiry_date IS NOT NULL;
