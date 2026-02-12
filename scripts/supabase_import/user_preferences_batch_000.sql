INSERT INTO user_preferences (user_id, audio_enabled, background_music_enabled, volume_level, preferred_subjects, theme_preference)
VALUES
(1, 1, 1, 0.7, NULL, 'classic'),
(2, 1, 1, 0.7, NULL, 'classic')
ON CONFLICT (user_id) DO NOTHING;
