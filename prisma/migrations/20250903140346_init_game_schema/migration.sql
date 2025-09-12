-- CreateTable
CREATE TABLE "public"."Player" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" SERIAL NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "master" TEXT NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT false,
    "question" TEXT,
    "answer" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionCode_key" ON "public"."Session"("sessionCode");

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
