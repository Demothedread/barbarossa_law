INSERT INTO users (id, username, email, password_hash, created_at)
VALUES
(1, 'pseudo', 'hocomnia@gmail.com', '$2b$12$Vi4s8sxG66QCXPzU5vemzepjXuAXkXylEMSE90NeaEjgJWQMXhWu2', '2025-07-24T12:58:37.545359'),
(2, 'poser', 'poser@poser.com', '$2b$12$DCBrr/ghMz4/92Zvf.sc/uuaZWqw5C6VBqir5xfcf2j1jG62XpmNy', '2026-01-25T19:43:17.558131')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
