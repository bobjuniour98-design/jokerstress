-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rank" TEXT NOT NULL DEFAULT 'user',
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT DEFAULT 'free',
    "planExpire" DATETIME,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "balance" REAL NOT NULL DEFAULT 0,
    "secretKey" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "concurrent" INTEGER NOT NULL DEFAULT 0,
    "attackDuration" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Attack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "layer" TEXT NOT NULL DEFAULT '7'
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "TotalAttacks" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Method" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
