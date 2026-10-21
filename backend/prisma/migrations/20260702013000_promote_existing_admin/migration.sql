UPDATE "users"
SET "role" = 'admin'
WHERE LOWER("email") = 'admin123@gmail.com';
