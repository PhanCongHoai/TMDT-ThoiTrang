-- ====================================================================
-- ROLLBACK MIGRATION: USER BEHAVIOR TRACKING & AI DEMAND FORECASTING
-- Dự án: AURALIÈ Haute Couture
-- Mục đích: Gỡ bỏ an toàn các bảng tracking & ML nếu cần rollback
-- ====================================================================

USE AURALIE_FashionDB;
GO

IF OBJECT_ID('MLMonitoringAlerts', 'U') IS NOT NULL DROP TABLE MLMonitoringAlerts;
IF OBJECT_ID('ProductForecasts', 'U') IS NOT NULL DROP TABLE ProductForecasts;
IF OBJECT_ID('MLTrainingLogs', 'U') IS NOT NULL DROP TABLE MLTrainingLogs;
IF OBJECT_ID('MLModelVersions', 'U') IS NOT NULL DROP TABLE MLModelVersions;
IF OBJECT_ID('ProductInventorySnapshots', 'U') IS NOT NULL DROP TABLE ProductInventorySnapshots;
IF OBJECT_ID('ProductDailyMetrics', 'U') IS NOT NULL DROP TABLE ProductDailyMetrics;
IF OBJECT_ID('user_behavior_daily', 'U') IS NOT NULL DROP TABLE user_behavior_daily;
IF OBJECT_ID('product_interactions', 'U') IS NOT NULL DROP TABLE product_interactions;
IF OBJECT_ID('user_search_history', 'U') IS NOT NULL DROP TABLE user_search_history;
IF OBJECT_ID('user_events', 'U') IS NOT NULL DROP TABLE user_events;
IF OBJECT_ID('user_sessions', 'U') IS NOT NULL DROP TABLE user_sessions;
IF OBJECT_ID('tracking_consents', 'U') IS NOT NULL DROP TABLE tracking_consents;

IF COL_LENGTH('abandoned_carts', 'session_id') IS NOT NULL
    ALTER TABLE abandoned_carts DROP COLUMN session_id;
IF COL_LENGTH('abandoned_carts', 'anonymous_id') IS NOT NULL
    ALTER TABLE abandoned_carts DROP COLUMN anonymous_id;
GO

PRINT '[Rollback] Rolled back Behavior Tracking & AI Demand Forecasting tables.';
GO

