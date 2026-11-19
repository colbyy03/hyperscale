-- expect: check the window frame
SELECT rack, ts, AVG(temp) OVER (PARTITION BY rack ORDER BY ts ROWS BETWEEN 15 PRECEDING AND CURRENT ROW) AS avg15
FROM inlet QUALIFY avg15 > 27.0 ORDER BY rack, ts;
