-- One row per day: day (DATE) and pue, ordered by day.
-- This is the query behind the ops dashboard. Find what's wrong with it.
SELECT CAST(ts AS DATE) AS day,
       AVG(facility_kw / it_kw) AS pue
FROM meter
GROUP BY day
ORDER BY day;
