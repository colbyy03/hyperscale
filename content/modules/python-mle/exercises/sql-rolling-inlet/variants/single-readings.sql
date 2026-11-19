-- expect: filtering on single readings
SELECT rack, ts, temp AS avg15 FROM inlet WHERE temp > 27.0 ORDER BY rack, ts;
