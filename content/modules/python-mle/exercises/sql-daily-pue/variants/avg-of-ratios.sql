-- expect: average of the 15-minute PUE values
SELECT CAST(ts AS DATE) AS day, AVG(facility_kw / it_kw) AS pue FROM meter GROUP BY day ORDER BY day;
