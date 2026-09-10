-- Seed Intimacy Games
INSERT INTO intimacy_games (id, title, description, category, intensity, content, created_at)
VALUES 
  (gen_random_uuid(), 'Truth or Dare: Emotional Edition', 'A vulnerable take on the classic. Build emotional intimacy through deep questions and sensory dares.', 'Card Games', 'Sensory', '{"rules": ["Take turns drawing a card.", "If truth, answer honestly without deflection.", "If dare, perform the sensory action with your partner."]}', now()),
  (gen_random_uuid(), 'Spicy Movie Bingo', 'Turn your next movie night into a slow-burn connection experience.', 'Movie Night Games', 'Playful', '{"rules": ["Print the bingo cards.", "When a trope happens on screen, complete the associated intimacy action.", "First to bingo gets to choose the post-movie activity."]}', now()),
  (gen_random_uuid(), 'Sip & Strip: The Boundary Explorer', 'A progressive drinking game where communication is the currency.', 'Drinking Games', 'Intense', '{"rules": ["Roll the dice to determine the topic.", "Take a sip if you refuse to answer.", "Remove an item of clothing if you both share the same fantasy."]}', now()),
  (gen_random_uuid(), 'The Blindfold Taste Test', 'Heighten your senses and trust. A perfect date night appetizer.', 'Date Night Games', 'Playful', '{"rules": ["One partner is blindfolded.", "The other partner feeds them different flavors.", "Guess the flavor. Wrong guesses incur a penalty kiss."]}', now())
ON CONFLICT DO NOTHING;
