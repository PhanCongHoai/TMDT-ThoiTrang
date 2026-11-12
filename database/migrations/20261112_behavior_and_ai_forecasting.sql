-- ====================================================================
-- MIGRATION: USER BEHAVIOR TRACKING, ANALYTICS & AI DEMAND FORECASTING
-- Dự án: AURALIÈ Haute Couture
-- Ngày: 12/11/2026
-- Tính an toàn: Non-destructive, idempotent (IF NOT EXISTS), không sửa/xóa dữ liệu cũ
-- ====================================================================

USE AURALIE_FashionDB;
GO

-- 1. Quản lý đồng ý theo dõi (Tracking Consents - Bảo mật & Quyền riêng tư)
IF OBJECT_ID('tracking_consents', 'U') IS NULL
BEGIN
    CREATE TABLE tracking_consents (
        consent_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NOT NULL,
        consent_type NVARCHAR(50) NOT NULL, -- ESSENTIAL, ANALYTICS, MARKETING
        consent_status NVARCHAR(20) NOT NULL CHECK (consent_status IN ('GRANTED', 'DENIED')),
        consent_timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        policy_version NVARCHAR(20) NOT NULL DEFAULT '1.0',
        CONSTRAINT FK_Consents_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IX_Consents_Anon_Type ON tracking_consents(anonymous_id, consent_type, consent_timestamp DESC);
    CREATE INDEX IX_Consents_User_Type ON tracking_consents(user_id, consent_type) WHERE user_id IS NOT NULL;
    PRINT '[Migration] Created table tracking_consents';
END
GO

-- 2. Phiên truy cập người dùng (User Sessions)
IF OBJECT_ID('user_sessions', 'U') IS NULL
BEGIN
    CREATE TABLE user_sessions (
        session_id NVARCHAR(100) PRIMARY KEY,
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NOT NULL,
        started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        last_activity_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ended_at DATETIME2 NULL,
        landing_page NVARCHAR(500) NULL,
        referrer NVARCHAR(500) NULL,
        device_type NVARCHAR(30) NULL,
        browser NVARCHAR(50) NULL,
        operating_system NVARCHAR(50) NULL,
        traffic_source NVARCHAR(100) NULL,
        utm_source NVARCHAR(100) NULL,
        utm_medium NVARCHAR(100) NULL,
        utm_campaign NVARCHAR(100) NULL,
        CONSTRAINT FK_Sessions_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IX_Sessions_Anon ON user_sessions(anonymous_id, started_at DESC);
    CREATE INDEX IX_Sessions_User ON user_sessions(user_id, started_at DESC) WHERE user_id IS NOT NULL;
    CREATE INDEX IX_Sessions_Activity ON user_sessions(last_activity_at DESC);
    PRINT '[Migration] Created table user_sessions';
END
GO

-- 3. Bảng sự kiện hành vi người dùng (User Events - Append-only)
IF OBJECT_ID('user_events', 'U') IS NULL
BEGIN
    CREATE TABLE user_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(100) NOT NULL UNIQUE, -- Deduplication ID
        event_name NVARCHAR(80) NOT NULL,
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NOT NULL,
        session_id NVARCHAR(100) NOT NULL,
        product_id INT NULL,
        category_id INT NULL,
        event_timestamp DATETIME2 NOT NULL, -- UTC timestamp từ client/server
        page_url NVARCHAR(500) NULL,
        referrer_url NVARCHAR(500) NULL,
        device_type NVARCHAR(30) NULL,
        browser NVARCHAR(50) NULL,
        operating_system NVARCHAR(50) NULL,
        event_properties NVARCHAR(MAX) NULL CHECK (event_properties IS NULL OR ISJSON(event_properties) = 1),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Events_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
        CONSTRAINT FK_Events_Sessions FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE,
        CONSTRAINT FK_Events_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION,
        CONSTRAINT FK_Events_Categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE NO ACTION
    );
    CREATE INDEX IX_Events_Name_Time ON user_events(event_name, event_timestamp DESC);
    CREATE INDEX IX_Events_Product_Time ON user_events(product_id, event_timestamp DESC) WHERE product_id IS NOT NULL;
    CREATE INDEX IX_Events_User_Time ON user_events(user_id, event_timestamp DESC) WHERE user_id IS NOT NULL;
    CREATE INDEX IX_Events_Anon_Time ON user_events(anonymous_id, event_timestamp DESC);
    CREATE INDEX IX_Events_Session ON user_events(session_id, event_timestamp ASC);
    PRINT '[Migration] Created table user_events';
END
GO

-- 4. Lịch sử tìm kiếm (User Search History)
IF OBJECT_ID('user_search_history', 'U') IS NULL
BEGIN
    CREATE TABLE user_search_history (
        search_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NOT NULL,
        session_id NVARCHAR(100) NOT NULL,
        keyword NVARCHAR(255) NOT NULL,
        result_count INT NOT NULL DEFAULT 0,
        clicked_product_id INT NULL,
        filters_json NVARCHAR(MAX) NULL CHECK (filters_json IS NULL OR ISJSON(filters_json) = 1),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Search_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT FK_Search_Products FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL
    );
    CREATE INDEX IX_Search_Keyword_Time ON user_search_history(keyword, created_at DESC);
    CREATE INDEX IX_Search_Session ON user_search_history(session_id);
    PRINT '[Migration] Created table user_search_history';
END
GO

-- 5. Tương tác sản phẩm chi tiết (Product Interactions)
IF OBJECT_ID('product_interactions', 'U') IS NULL
BEGIN
    CREATE TABLE product_interactions (
        interaction_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NOT NULL,
        session_id NVARCHAR(100) NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        interaction_type NVARCHAR(50) NOT NULL, -- VIEW, CLICK, VARIANT_SELECT, ADD_TO_CART, WISHLIST_ADD, SHARE
        interaction_value NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ProdInt_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT FK_ProdInt_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProdInt_Product_Type_Time ON product_interactions(product_id, interaction_type, created_at DESC);
    CREATE INDEX IX_ProdInt_Anon_Time ON product_interactions(anonymous_id, created_at DESC);
    PRINT '[Migration] Created table product_interactions';
END
GO

-- 6. Tổng hợp hành vi khách hàng theo ngày (User Behavior Daily)
IF OBJECT_ID('user_behavior_daily', 'U') IS NULL
BEGIN
    CREATE TABLE user_behavior_daily (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        behavior_date DATE NOT NULL,
        actor_key NVARCHAR(120) NOT NULL, -- 'U:' + user_id hoặc 'A:' + anonymous_id
        user_id INT NULL,
        anonymous_id NVARCHAR(100) NULL,
        total_product_views INT NOT NULL DEFAULT 0,
        total_searches INT NOT NULL DEFAULT 0,
        total_cart_adds INT NOT NULL DEFAULT 0,
        total_wishlist_adds INT NOT NULL DEFAULT 0,
        total_purchases INT NOT NULL DEFAULT 0,
        total_orders INT NOT NULL DEFAULT 0,
        total_spent DECIMAL(18, 2) NOT NULL DEFAULT 0,
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_UserBehaviorDaily UNIQUE (behavior_date, actor_key)
    );
    CREATE INDEX IX_UserBehaviorDaily_Date ON user_behavior_daily(behavior_date DESC);
    PRINT '[Migration] Created table user_behavior_daily';
END
GO

-- 7. Bảng tổng hợp số liệu sản phẩm theo ngày (ProductDailyMetrics - Dữ liệu đầu vào ML)
IF OBJECT_ID('ProductDailyMetrics', 'U') IS NULL
BEGIN
    CREATE TABLE ProductDailyMetrics (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        metric_date DATE NOT NULL,
        total_views INT NOT NULL DEFAULT 0,
        unique_viewers INT NOT NULL DEFAULT 0,
        total_searches_clicked INT NOT NULL DEFAULT 0,
        total_cart_adds INT NOT NULL DEFAULT 0,
        total_wishlist_adds INT NOT NULL DEFAULT 0,
        total_orders INT NOT NULL DEFAULT 0,
        total_units_sold INT NOT NULL DEFAULT 0, -- Chỉ tính đơn hợp lệ (không tính CANCELLED)
        total_revenue DECIMAL(18, 2) NOT NULL DEFAULT 0,
        conversion_rate DECIMAL(8, 4) NOT NULL DEFAULT 0,
        current_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
        stock_quantity INT NOT NULL DEFAULT 0,
        is_out_of_stock BIT NOT NULL DEFAULT 0,
        trend_anomaly_flag NVARCHAR(30) NULL, -- SPIKE, DROP, NORMAL
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ProductDailyMetrics UNIQUE (product_id, metric_date),
        CONSTRAINT FK_PDM_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_PDM_Date ON ProductDailyMetrics(metric_date DESC);
    CREATE INDEX IX_PDM_Product_Date ON ProductDailyMetrics(product_id, metric_date DESC);
    PRINT '[Migration] Created table ProductDailyMetrics';
END
GO

-- 8. Bảng chụp tồn kho hằng ngày (ProductInventorySnapshots - Bảo toàn lịch sử tồn kho)
IF OBJECT_ID('ProductInventorySnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE ProductInventorySnapshots (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        snapshot_date DATE NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        is_out_of_stock BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_InventorySnapshot UNIQUE (product_id, snapshot_date),
        CONSTRAINT FK_InvSnap_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_InvSnap_Date ON ProductInventorySnapshots(snapshot_date DESC);
    PRINT '[Migration] Created table ProductInventorySnapshots';
END
GO

-- 9. Quản lý phiên bản mô hình ML (MLModelVersions)
IF OBJECT_ID('MLModelVersions', 'U') IS NULL
BEGIN
    CREATE TABLE MLModelVersions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        model_version NVARCHAR(50) NOT NULL UNIQUE, -- VD: v1.0-baseline, v1.1-lgbm
        model_type NVARCHAR(50) NOT NULL, -- LIGHTGBM, XGBOOST, MOVING_AVERAGE_BASELINE
        horizon_days INT NOT NULL DEFAULT 7, -- 7, 14, 30 hoặc 0 nếu multi-horizon
        training_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        dataset_start_date DATE NULL,
        dataset_end_date DATE NULL,
        hyperparameters_json NVARCHAR(MAX) NULL,
        train_metrics_json NVARCHAR(MAX) NULL,
        val_metrics_json NVARCHAR(MAX) NULL,
        test_metrics_json NVARCHAR(MAX) NULL,
        feature_schema_json NVARCHAR(MAX) NULL,
        artifact_path NVARCHAR(500) NULL,
        status NVARCHAR(30) NOT NULL CHECK (status IN ('TRAINING', 'STAGING', 'ACTIVE', 'ARCHIVED', 'FAILED', 'ROLLED_BACK')),
        is_production BIT NOT NULL DEFAULT 0,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_MLModel_Prod ON MLModelVersions(is_production, status);
    PRINT '[Migration] Created table MLModelVersions';
END
GO

-- 10. Nhật ký huấn luyện & đánh giá mô hình (MLTrainingLogs)
IF OBJECT_ID('MLTrainingLogs', 'U') IS NULL
BEGIN
    CREATE TABLE MLTrainingLogs (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        run_id NVARCHAR(80) NOT NULL UNIQUE,
        trigger_type NVARCHAR(40) NOT NULL, -- MONTHLY_SCHEDULED, EARLY_DRIFT_TRIGGER, MANUAL, WEEKLY_EVALUATION
        model_version NVARCHAR(50) NULL,
        status NVARCHAR(30) NOT NULL, -- STARTED, SUCCESS, SKIPPED_INSUFFICIENT_DATA, REJECTED_WORSE_THAN_PROD, FAILED
        dataset_rows INT NOT NULL DEFAULT 0,
        mae DECIMAL(12, 4) NULL,
        rmse DECIMAL(12, 4) NULL,
        wape DECIMAL(12, 4) NULL,
        forecast_bias DECIMAL(12, 4) NULL,
        baseline_mae DECIMAL(12, 4) NULL,
        promoted BIT NOT NULL DEFAULT 0,
        message NVARCHAR(MAX) NULL,
        started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        finished_at DATETIME2 NULL
    );
    CREATE INDEX IX_MLTrainLogs_Time ON MLTrainingLogs(started_at DESC);
    PRINT '[Migration] Created table MLTrainingLogs';
END
GO

-- 11. Kết quả dự đoán nhu cầu sản phẩm & đối soát thực tế (ProductForecasts)
IF OBJECT_ID('ProductForecasts', 'U') IS NULL
BEGIN
    CREATE TABLE ProductForecasts (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        forecast_base_date DATE NOT NULL, -- Ngày thực hiện dự đoán
        horizon_days INT NOT NULL CHECK (horizon_days IN (7, 14, 30)),
        target_date_end DATE NOT NULL, -- Ngày kết thúc kỳ dự báo
        predicted_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
        confidence_low DECIMAL(12, 2) NULL,
        confidence_high DECIMAL(12, 2) NULL,
        trend_direction NVARCHAR(20) NOT NULL DEFAULT 'STABLE', -- UP, DOWN, STABLE
        growth_rate_percent DECIMAL(8, 2) NOT NULL DEFAULT 0,
        recommended_restock_qty INT NOT NULL DEFAULT 0,
        low_stock_risk BIT NOT NULL DEFAULT 0,
        model_version NVARCHAR(50) NOT NULL,
        actual_quantity INT NULL, -- Chỉ điền sau khi target_date_end đã qua
        abs_error DECIMAL(12, 2) NULL,
        evaluated_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ProductForecast UNIQUE (product_id, forecast_base_date, horizon_days),
        CONSTRAINT FK_Forecast_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Forecast_Base_Horizon ON ProductForecasts(forecast_base_date DESC, horizon_days);
    CREATE INDEX IX_Forecast_Eval ON ProductForecasts(target_date_end, evaluated_at);
    PRINT '[Migration] Created table ProductForecasts';
END
GO

-- 12. Bảng cảnh báo giám sát chất lượng mô hình & dữ liệu (MLMonitoringAlerts)
IF OBJECT_ID('MLMonitoringAlerts', 'U') IS NULL
BEGIN
    CREATE TABLE MLMonitoringAlerts (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        alert_type NVARCHAR(50) NOT NULL, -- MODEL_DRIFT, DATA_DRIFT, EARLY_RETRAIN_NEEDED, TRAINING_FAILED, ANOMALY_TREND, LOW_STOCK_RISK
        severity NVARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
        product_id INT NULL,
        model_version NVARCHAR(50) NULL,
        metric_value DECIMAL(12, 4) NULL,
        threshold_value DECIMAL(12, 4) NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_resolved BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        resolved_at DATETIME2 NULL
    );
    CREATE INDEX IX_MLAlerts_Active ON MLMonitoringAlerts(is_resolved, created_at DESC);
    PRINT '[Migration] Created table MLMonitoringAlerts';
END
GO

-- 13. Bổ sung anonymous_id & session_id vào bảng abandoned_carts hiện có (tái sử dụng bảng cũ, không tạo trùng)
IF COL_LENGTH('abandoned_carts', 'anonymous_id') IS NULL
BEGIN
    ALTER TABLE abandoned_carts ADD anonymous_id NVARCHAR(100) NULL;
    PRINT '[Migration] Added anonymous_id to abandoned_carts';
END
GO
IF COL_LENGTH('abandoned_carts', 'session_id') IS NULL
BEGIN
    ALTER TABLE abandoned_carts ADD session_id NVARCHAR(100) NULL;
    PRINT '[Migration] Added session_id to abandoned_carts';
END
GO
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('abandoned_carts') AND name = 'user_email' AND is_nullable = 0)
BEGIN
    ALTER TABLE abandoned_carts ALTER COLUMN user_email NVARCHAR(150) NULL;
    PRINT '[Migration] Allowed NULL user_email in abandoned_carts for anonymous carts';
END
GO

PRINT '[Migration] Completed Behavior Tracking & AI Demand Forecasting Migration!';
GO
