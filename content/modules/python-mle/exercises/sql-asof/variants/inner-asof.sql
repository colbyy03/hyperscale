-- expect: plain ASOF JOIN drops minutes
SELECT g.ts, p.kw FROM grid g ASOF JOIN power p ON g.ts >= p.ts ORDER BY g.ts;
