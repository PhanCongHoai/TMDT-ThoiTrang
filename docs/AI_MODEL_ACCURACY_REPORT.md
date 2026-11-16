# BÁO CÁO ĐÁNH GIÁ ĐỘ CHÍNH XÁC MÔ HÌNH AI (AI MODEL ACCURACY REPORT)

**Ngày đánh giá:** 2026-11-12  
**Hệ thống:** AURALIÈ AI Demand Forecasting (`ai-service/app/features.py`, `trainer.py`, `evaluator.py`)

---

## 1. Đánh Giá Tính Sẵn Sàng Dữ Liệu Thực Tế (`AURALIE_FashionDB`)

| Chỉ số kiểm tra | Giá trị thực tế | Ngưỡng yêu cầu ML | Kết luận |
|---|---:|---:|---|
| Tổng đơn hàng (`orders`) | 67 (60 hợp lệ, 7 hủy) | - | PASS |
| Số ngày phát sinh bán hàng hợp lệ (`valid_sales_days`) | **6 ngày** (`2026-10-16` -> `2026-11-05`) | >= **30 ngày** | **KHÔNG ĐẠT (BLOCKED)** |
| Độ phủ sản phẩm có đơn hàng | **4 / 20 sản phẩm** (20%) | >= 50% sản phẩm | **KHÔNG ĐẠT (BLOCKED)** |
| Mẫu chuỗi thời gian đủ nhãn `target_7d` | 0 mẫu đủ ngưỡng | >= 100 mẫu | **BLOCKED** |

**Kết luận trung thực về dữ liệu thật:**
- Khi gọi `POST /api/ml/train` trên dữ liệu thật của `AURALIE_FashionDB`, hệ thống trả về `SKIPPED_INSUFFICIENT_DATA` và giữ nguyên `v1.0-baseline` (`MOVING_AVERAGE_BASELINE`).
- **Trạng thái kiểm chứng độ chính xác LightGBM trên dữ liệu thật:** **BLOCKED (do thiếu dữ liệu lịch sử >= 30 ngày)**. Không sử dụng số liệu giả để báo cáo độ chính xác production.

---

## 2. Kiểm Chứng Pipeline & So Sánh Mô Hình Trên Bộ Dữ Liệu Kiểm Thử (`TEST DATA` — Đã Dọn Dẹp)

Để kiểm chứng thuật toán chia tập theo thời gian (`70% Train / 15% Val / 15% Test`), lọc hết hàng (`stockout censoring`), và so sánh đa mô hình, đã chạy bộ kiểm thử cô lập trong bộ nhớ (`175 mẫu / 35 ngày / 5 sản phẩm`, gắn nhãn `TEST DATA` và dọn sạch sau khi chạy):

### 2.1. Bảng So Sánh Sai Số Trên Tập Test (Time-Based Split)

| Horizon | Mô hình | MAE | RMSE | WAPE | sMAPE | Forecast Bias |
|---|---|---:|---:|---:|---:|---:|
| **7d** | **Moving Average 7d** | **2.5667** | **3.0496** | **0.0625** | 0.0691 | -2.5667 |
| **7d** | **XGBoost** | **2.6378** | **3.0645** | **0.0642** | **0.0661** | -1.5463 |
| **7d** | **LightGBM** | 3.1303 | 3.5686 | 0.0762 | 0.0801 | -1.6603 |
| **7d** | Statistical Baseline | 3.2293 | 3.5760 | 0.0786 | 0.0859 | -3.2293 |
| **7d** | Naive (`sales_1d * 7`) | 6.5333 | 7.5100 | 0.1591 | 0.1634 | -0.9333 |
| **14d** | **Moving Average 7d** | **5.3667** | **6.0028** | **0.0652** | 0.0685 | -5.3667 |
| **14d** | **XGBoost** | **5.3971** | **6.1190** | **0.0655** | **0.0676** | -0.6355 |
| **14d** | Statistical Baseline | 6.6920 | 7.1683 | 0.0812 | 0.0853 | -6.6920 |
| **14d** | **LightGBM** | 7.1024 | 7.6506 | 0.0862 | 0.0872 | -2.3621 |
| **14d** | Naive (`sales_1d * 14`) | 12.7000 | 14.6481 | 0.1542 | 0.1576 | -2.1000 |
| **30d** | **XGBoost** | **11.5547** | **13.2103** | **0.0625** | **0.0670** | **-0.7045** |
| **30d** | **LightGBM** | **14.3080** | **15.6057** | **0.0773** | **0.0791** | -5.0432 |
| **30d** | Moving Average 7d | 20.0000 | 20.9872 | 0.1081 | 0.1152 | -20.0000 |
| **30d** | Statistical Baseline | 22.8400 | 23.7052 | 0.1235 | 0.1321 | -22.8400 |
| **30d** | Naive (`sales_1d * 30`) | 29.3333 | 35.0133 | 0.1586 | 0.1692 | -13.0000 |

### 2.2. Nhận Xét Kỹ Thuật & Lỗi Đã Sửa Trong Quá Trình Kiểm Chứng

1. Ở kỳ **30 ngày**, mô hình ML (`XGBoost` WAPE `6.25%`, `LightGBM` WAPE `7.73%`) vượt trội rõ rệt so với `Moving Average 7d` (`10.81%`), `Statistical Baseline` (`12.35%`), và `Naive` (`15.86%`) nhờ học được xu hướng tăng trưởng dài hạn.
2. **2 lỗi thực tế đã phát hiện & sửa trong `trainer.py`:**
   - Ép kiểu `row[FEATURE_COLUMNS].to_frame().T.astype(float)` trước khi gọi `lgbm.predict(...)` trong `run_daily_predictions()` (tránh lỗi `ValueError: pandas dtypes must be int, float or bool` khi `object` dtype phát sinh).
   - Bổ sung giây (`%Y%m%d.%H%M%S`) vào tên phiên bản model để tránh đụng `UNIQUE KEY` khi train 2 lần trong cùng 1 phút.
   - Bổ sung **stockout censoring** (`(is_out_of_stock == 0) | (target > 0)`) trên tập huấn luyện và clip giá trị dự báo âm (`np.maximum(0.0, ...)`).

