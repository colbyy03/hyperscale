-- expect: expected 31 rows
SELECT g.ts, p.kw FROM grid g JOIN power p ON g.ts = p.ts ORDER BY g.ts;
