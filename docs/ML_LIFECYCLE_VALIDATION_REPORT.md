# BÁO CÁO KIỂM CHỨNG VÒNG ĐỜI MÔ HÌNH LIÊN TỤC (ML LIFECYCLE VALIDATION REPORT)

**Ngày kiểm chứng:** 2026-11-12  
**Phạm vi:** `ai-service/app/trainer.py`, `evaluator.py`, `backend/src/jobs/mlLifecycle.job.js`, `MLModelVersions`, `MLTrainingLogs`, `ProductForecasts`

---

## 1. Kết Quả Kịch Bản Kiểm Thử Vòng Đời End-to-End (Trên Test Fixture Cô Lập)

| Bước | Hành động | Kết quả thực tế quan sát được | Trạng thái |
|---|---|---|---|
| 1 | Huấn luyện candidate `v1` (`TEST_FIXTURE_V1`, `force=True`) | Tạo model `v20261112.145358-lgbm`, lưu artifact `.joblib`, vượt baseline (`MAE 3.1303 <= 3.2293 * 1.05`), `promoted: true` | **PASS** |
| 2 | Chạy `run_daily_predictions()` bằng model `v1` | Nạp artifact `.joblib` thành công, sinh **60 dòng dự báo** (`20` sản phẩm x `3` horizons `7/14/30`) | **PASS** |
| 3 | Chạy `evaluate_completed_forecasts()` cho kỳ đã đáo hạn | Cập nhật `actual_quantity` & `abs_error` cho `1` dự báo đã đủ ngày, ghi `MLTrainingLogs` (`EVAL-...`, `mae: 5.0`, `drift_detected: false`) | **PASS** |
| 4 | Huấn luyện candidate `v2` (`TEST_FIXTURE_V2`) | Tạo phiên bản `v20261112.145359-lgbm`, so sánh với `v1` qua promotion gate (`beats_baseline && beats_prev`) | **PASS** |
| 5 | Rollback về `v1.0-baseline` | Đánh dấu phiên bản đang chạy `ROLLED_BACK`, khôi phục `v1.0-baseline` (`is_production = 1`, `status = 'ACTIVE'`) | **PASS** |
| 6 | Dọn dẹp dữ liệu & file tạm (`finally`) | Xóa sạch toàn bộ bản ghi test trong `MLModelVersions`, `MLTrainingLogs`, `ProductForecasts`, `MLMonitoringAlerts` và 2 file `.joblib` tạm | **PASS** |

---

## 2. Cơ Chế Bảo Vệ Vận Hành Đã Xác Minh

- **Không tự động promote mù quáng:** Candidate mới chỉ được `ACTIVE` khi `lgbm_mae_7d <= baseline_mae_7d * 1.05` VÀ `lgbm_mae_7d <= prev_prod_mae_7d`.
- **Chống đánh giá sớm:** `evaluate_completed_forecasts()` chỉ chấm điểm các bản ghi có `target_date_end < CAST(DATEADD(HOUR, 7, SYSUTCDATETIME()) AS DATE)` và `actual_quantity IS NULL`.
- **An toàn dữ liệu thật:** Tất cả bản ghi test đã được dọn dẹp sạch; trạng thái production hiện tại giữ nguyên `v1.0-baseline` (`ACTIVE`).

