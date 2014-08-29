

-- Select latests comments for given tickets
-- PGPASSWORD=password psql -U puavo-ticket -h localhost puavo-ticket-test < extra/latestcomments.sql

SELECT "c".*
FROM comments c
INNER JOIN
        (SELECT
                "ticketId",
                MAX("createdAt") AS maxdate
        FROM comments
        GROUP BY "ticketId") maxtable
        ON "c"."ticketId" = "maxtable"."ticketId"
        AND "c"."createdAt" = "maxtable"."maxdate"
WHERE "c"."ticketId" IN (941, 942);
