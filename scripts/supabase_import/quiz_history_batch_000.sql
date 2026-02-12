INSERT INTO quiz_history (id, user_id, subject, correct, total, duration_seconds, questions_json, answers_json, negative_time, created_at)
VALUES
(1, 'user_pwwshbdxpzj', 'EVIDENCE', 1, 3, 302, '["mbe_1021", "mbe_1147", "mbe_149"]', '[3, 2, 0]', 0, '2025-07-20T21:57:18.936965'),
(2, 'user_pwwshbdxpzj', 'EVIDENCE', 3, 5, 445, '["mbe_762", "mbe_1065", "mbe_518", "mbe_124", "mbe_878"]', '[3, 0, 3, 0, 1]', 0, '2025-07-20T23:59:59.453316'),
(3, 'user_pwwshbdxpzj', 'TORTS', 2, 3, 314, '["mbe_792", "mbe_376", "mbe_1017"]', '[1, 2, 1]', 0, '2025-07-21T00:16:24.045296'),
(4, 'user_pwwshbdxpzj', 'TORTS', 1, 1, 48, '["mbe_1080"]', '[2]', 0, '2025-07-21T03:09:43.868741'),
(5, 'user_pwwshbdxpzj', 'CONTRACTS', 0, 1, 105, '["mbe_1032"]', '[2]', 0, '2025-07-21T12:42:01.392206'),
(6, 'user_50p56mpaqdb', 'CONST. LAW', 2, 2, 302, '["mbe_1083", "mbe_834"]', '[0, 0]', 1, '2025-07-22T18:23:12.539456'),
(7, 'user_pwwshbdxpzj', '', 1, 1, 321, '["mbe_137"]', '[2]', 1, '2025-07-22T20:33:43.353257'),
(8, 'user_pwwshbdxpzj', 'Torts', 1, 1, 50, '["pmbrmbe_0079"]', '[0]', 0, '2025-07-22T21:12:35.312979'),
(9, 'user_pwwshbdxpzj', '', 0, 1, 121, '["mbe_298"]', '[2]', 1, '2025-07-23T09:57:26.756651'),
(10, 'user_pwwshbdxpzj', 'REAL PROP.', 1, 1, 107, '["mbe_934"]', '[3]', 0, '2025-07-23T10:07:25.260191'),
(11, 'anonymous_7lpp24i20x', 'REAL PROP.', 0, 1, 212, '["mbe_1161"]', '[2]', 1, '2025-07-24T01:21:32.582756')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('quiz_history', 'id'), COALESCE((SELECT MAX(id) FROM quiz_history), 1));
