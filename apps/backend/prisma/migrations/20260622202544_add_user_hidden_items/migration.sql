-- CreateTable
CREATE TABLE "user_hidden_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" "FavoriteEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_hidden_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_hidden_items_user_id_entity_type_entity_id_key" ON "user_hidden_items"("user_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "user_hidden_items" ADD CONSTRAINT "user_hidden_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
