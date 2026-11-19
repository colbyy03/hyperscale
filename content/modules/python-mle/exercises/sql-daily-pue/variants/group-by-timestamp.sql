-- expect: Group by the date, not the timestamp
SELECT ts AS day, SUM(facility_kw) / SUM(it_kw) AS pue FROM meter GROUP BY ts ORDER BY ts;
