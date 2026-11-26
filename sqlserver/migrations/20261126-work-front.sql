-- Additive migration: preserve all existing records and accept older APKs.
IF COL_LENGTH('app.records','work_front') IS NULL
 EXEC(N'ALTER TABLE [app].[records] ADD [work_front] nvarchar(max) COLLATE Latin1_General_100_BIN2 NULL');
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='records_work_front_length' AND parent_object_id=OBJECT_ID('app.records'))
 EXEC(N'ALTER TABLE [app].[records] WITH CHECK ADD CONSTRAINT [records_work_front_length] CHECK ([work_front] IS NULL OR DATALENGTH([work_front])<=240)');
