-- For every minute: ts, and the latest kw reading at or before it (NULL before the first reading).
SELECT g.ts, p.kw
FROM grid g
JOIN power p ON g.ts = p.ts
ORDER BY g.ts;
