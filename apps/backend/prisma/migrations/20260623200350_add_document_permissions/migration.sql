-- CreateEnum
CREATE TYPE "DocumentAccess" AS ENUM ('VIEW', 'COMMENT', 'EDIT');

-- CreateTable
CREATE TABLE "document_permissions" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "access" "DocumentAccess" NOT NULL DEFAULT 'VIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_permissions_user_id_idx" ON "document_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_permissions_node_id_user_id_key" ON "document_permissions"("node_id", "user_id");

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
