// Queries using this fragment join from products AS p.
const productBadgeJoin = `
  OUTER APPLY (
    SELECT SUM(CONVERT(bigint, oi.quantity)) AS sold_units
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    JOIN orders o ON o.id = oi.order_id
    WHERE pv.product_id = p.id AND o.status = 'COMPLETED'
  ) sales
  CROSS APPLY (
    SELECT CASE
      WHEN sales.sold_units >= 10 THEN 'BESTSELLER'
      WHEN p.created_at >= DATEADD(day, -14, SYSDATETIME())
        AND p.created_at <= SYSDATETIME() THEN 'NEW ARRIVAL'
    END AS tag
  ) badge
`;

module.exports = { productBadgeJoin };
