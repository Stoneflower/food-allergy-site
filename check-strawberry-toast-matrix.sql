-- product_allergies_matrixでイチゴホイップトーストのアレルギー情報を確認
SELECT 
  pam.product_id,
  pam.menu_name,
  pam.milk,
  pam.egg,
  pam.wheat
FROM product_allergies_matrix pam
WHERE pam.menu_name LIKE '%イチゴホイップトースト%';
