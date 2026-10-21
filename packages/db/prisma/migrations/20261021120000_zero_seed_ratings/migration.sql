-- Clear synthetic catalogue ratings. Real averages come back from product_reviews only.
UPDATE "products" SET "rating" = 0, "review_count" = 0;

-- Recompute from any real member reviews already stored.
UPDATE "products" AS p
SET
  "rating" = COALESCE(stats.avg_rating, 0),
  "review_count" = COALESCE(stats.cnt, 0)
FROM (
  SELECT
    "product_id",
    ROUND(AVG("rating")::numeric, 1)::double precision AS avg_rating,
    COUNT(*)::int AS cnt
  FROM "product_reviews"
  GROUP BY "product_id"
) AS stats
WHERE p."id" = stats."product_id";
