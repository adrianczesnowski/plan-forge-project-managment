-- CreateEnum
CREATE TYPE "DocumentNodeType" AS ENUM ('FOLDER', 'DOC');

-- CreateTable
CREATE TABLE "document_nodes" (
    "id" UUID NOT NULL,
    "type" "DocumentNodeType" NOT NULL DEFAULT 'DOC',
    "title" VARCHAR(300) NOT NULL,
    "icon" VARCHAR(50),
    "cover_color" VARCHAR(120),
    "content" JSONB,
    "parent_id" UUID,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_nodes_organization_id_idx" ON "document_nodes"("organization_id");

-- CreateIndex
CREATE INDEX "document_nodes_parent_id_idx" ON "document_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "document_nodes_created_by_id_idx" ON "document_nodes"("created_by_id");

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
