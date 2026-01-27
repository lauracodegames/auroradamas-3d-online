-- Function to increment wins
CREATE OR REPLACE FUNCTION increment_wins(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET wins = wins + 1, total_games = total_games + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment losses
CREATE OR REPLACE FUNCTION increment_losses(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET losses = losses + 1, total_games = total_games + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment draws
CREATE OR REPLACE FUNCTION increment_draws(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET draws = draws + 1, total_games = total_games + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_wins(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_losses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_draws(UUID) TO authenticated;
