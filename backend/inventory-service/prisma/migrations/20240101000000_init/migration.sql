CREATE TABLE "Inventory" (
    "id" SERIAL PRIMARY KEY,
    "productId" INTEGER NOT NULL UNIQUE,
    "quantity" INTEGER NOT NULL DEFAULT 0
);
