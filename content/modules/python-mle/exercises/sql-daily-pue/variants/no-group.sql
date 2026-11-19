-- expect: expected 3 rows
SELECT DATE '2026-07-14' AS day, SUM(facility_kw) / SUM(it_kw) AS pue FROM meter;
