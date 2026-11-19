-- expect: kw should be
SELECT g.ts, p.kw FROM grid g ASOF LEFT JOIN power p ON g.ts <= p.ts ORDER BY g.ts;
