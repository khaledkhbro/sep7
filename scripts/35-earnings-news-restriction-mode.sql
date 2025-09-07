-- Add restriction mode support to earnings news system
ALTER TABLE earnings_news 
ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE;

-- Update the get_earnings_news_for_user function to handle restriction mode
CREATE OR REPLACE FUNCTION get_earnings_news_for_user(
  user_country TEXT DEFAULT NULL,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail TEXT,
  description TEXT,
  money DECIMAL(10,2),
  countries TEXT[],
  is_restricted BOOLEAN,
  status BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.title,
    en.thumbnail,
    en.description,
    en.money,
    en.countries,
    en.is_restricted,
    en.status,
    en.created_at,
    en.updated_at,
    COUNT(*) OVER() as total_count
  FROM earnings_news en
  WHERE en.status = TRUE
    AND (
      -- Global news (no country restrictions)
      en.countries IS NULL
      OR
      -- Include mode: user's country is in the list
      (en.is_restricted = FALSE AND user_country = ANY(en.countries))
      OR
      -- Restrict mode: user's country is NOT in the list
      (en.is_restricted = TRUE AND (user_country IS NULL OR user_country != ALL(en.countries)))
    )
  ORDER BY en.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- Update admin function to include restriction mode
CREATE OR REPLACE FUNCTION get_admin_earnings_news(
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail TEXT,
  description TEXT,
  money DECIMAL(10,2),
  countries TEXT[],
  is_restricted BOOLEAN,
  status BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.title,
    en.thumbnail,
    en.description,
    en.money,
    en.countries,
    en.is_restricted,
    en.status,
    en.created_at,
    en.updated_at,
    COUNT(*) OVER() as total_count
  FROM earnings_news en
  ORDER BY en.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance on restriction queries
CREATE INDEX IF NOT EXISTS idx_earnings_news_restriction 
ON earnings_news(is_restricted, status) 
WHERE status = TRUE;

-- Add comment explaining the restriction logic
COMMENT ON COLUMN earnings_news.is_restricted IS 
'When FALSE (default): countries array defines who CAN see the news. When TRUE: countries array defines who CANNOT see the news.';
