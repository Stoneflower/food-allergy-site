-- すべてのビューのSECURITY DEFINERステータスを確認

SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN definition LIKE '%SECURITY DEFINER%' THEN 0 ELSE 1 END,
  viewname;

