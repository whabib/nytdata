-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "section" TEXT NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleToAuthor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArticleToAuthor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");

-- CreateIndex
CREATE INDEX "_ArticleToAuthor_B_index" ON "_ArticleToAuthor"("B");

-- AddForeignKey
ALTER TABLE "_ArticleToAuthor" ADD CONSTRAINT "_ArticleToAuthor_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToAuthor" ADD CONSTRAINT "_ArticleToAuthor_B_fkey" FOREIGN KEY ("B") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
