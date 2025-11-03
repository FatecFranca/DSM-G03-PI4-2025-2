/*
  Warnings:

  - Added the required column `humidity` to the `SensorData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `temperature` to the `SensorData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SensorData" ADD COLUMN     "humidity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "temperature" DOUBLE PRECISION NOT NULL;
