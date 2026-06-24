-- CreateTable
CREATE TABLE "document_project_links" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_project_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_project_links_project_id_idx" ON "document_project_links"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_project_links_node_id_project_id_key" ON "document_project_links"("node_id", "project_id");

-- AddForeignKey
ALTER TABLE "document_project_links" ADD CONSTRAINT "document_project_links_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_project_links" ADD CONSTRAINT "document_project_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_project_links" ADD CONSTRAINT "document_project_links_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
