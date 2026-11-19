SELECT CAST(ts AS DATE) AS day,
       SUM(facility_kw) / SUM(it_kw) AS pue
FROM meter
GROUP BY day
ORDER BY day;
