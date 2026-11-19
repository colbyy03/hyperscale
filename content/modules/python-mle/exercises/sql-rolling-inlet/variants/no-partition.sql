-- expect: each rack has its own window
SELECT rack, ts, AVG(temp) OVER (ORDER BY ts, rack ROWS BETWEEN 14 PRECEDING AND CURRENT ROW) AS avg15
FROM inlet QUALIFY avg15 > 27.0 ORDER BY rack, ts;
