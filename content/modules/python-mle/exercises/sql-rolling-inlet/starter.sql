-- Alerts: rack, ts, avg15 (trailing 15-minute average, above 27.0 °C), ordered by rack, ts.
SELECT rack, ts, temp AS avg15
FROM inlet
WHERE temp > 27.0
ORDER BY rack, ts;
