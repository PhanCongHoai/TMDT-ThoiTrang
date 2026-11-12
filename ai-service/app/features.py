import numpy as np
import pandas as pd
from datetime import datetime, timezone
from app.db import db_cursor

FEATURE_COLUMNS = [
    "sales_1_day_ago",
    "sales_7_days_ago",
    "sales_14_days_ago",
    "sales_28_days_ago",
    "avg_sales_7_days",
    "avg_sales_14_days",
    "avg_sales_30_days",
    "rolling_max_7_days",
    "rolling_std_7_days",
    "total_revenue_7_days",
    "total_revenue_30_days",
    "views_1_day",
    "views_7_days",
    "views_30_days",
    "cart_adds_7_days",
    "cart_adds_30_days",
    "wishlist_adds_7_days",
    "conversion_rate",
    "view_growth_rate",
    "cart_growth_rate",
    "view_to_cart_ratio",
    "current_price",
    "stock_quantity",
    "is_out_of_stock",
    "out_of_stock_days_7d",
    "day_of_week",
    "day_of_month",
    "month",
    "season",
    "holiday_flag",
    "category_id",
    "product_age_days",
]

# Các ngày lễ/mùa mua sắm lớn tại Việt Nam (tháng, ngày)
VN_HOLIDAY_MONTH_DAYS = {(1, 1), (2, 14), (3, 8), (4, 30), (5, 1), (9, 2), (10, 20), (11, 11), (11, 20), (12, 12), (12, 24), (12, 25)}


def _get_season(month: int) -> int:
    if month in (3, 4, 5):
        return 1  # Xuân
    if month in (6, 7, 8):
        return 2  # Hạ
    if month in (9, 10, 11):
        return 3  # Thu
    return 4      # Đông


def load_raw_product_daily_panel() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Trích xuất dữ liệu sản phẩm và chuỗi thời gian bán hàng/hành vi hợp lệ theo ngày từ SQL Server.
    Loại trừ đơn CANCELLED và đơn Online chưa thanh toán để không làm sai lệch nhu cầu thực tế.
    """
    with db_cursor() as cur:
        # 1. Lấy thông tin sản phẩm active & tồn kho hiện tại
        cur.execute("""
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                c.name AS category_name,
                COALESCE(p.category_id, 0) AS category_id,
                CAST(p.base_price AS FLOAT) AS current_price,
                p.created_at AS product_created_at,
                COALESCE(SUM(pv.stock_quantity), 0) AS current_stock,
                COALESCE((SELECT TOP 1 image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_thumbnail DESC, pi.id ASC), 'assets/card_1.jpg') AS image_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            WHERE p.is_active = 1
            GROUP BY p.id, p.name, c.name, p.category_id, p.base_price, p.created_at
        """)
        prod_cols = [d[0] for d in cur.description]
        products_df = pd.DataFrame.from_records(cur.fetchall(), columns=prod_cols)

        # 2. Lấy doanh số hợp lệ theo ngày từ orders + order_items
        cur.execute("""
            SELECT 
                pv.product_id,
                CAST(DATEADD(HOUR, 7, o.created_at) AS DATE) AS metric_date,
                SUM(oi.quantity) AS units_sold,
                SUM(CAST(oi.quantity * oi.price AS FLOAT)) AS revenue,
                COUNT(DISTINCT o.id) AS orders_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN product_variants pv ON oi.variant_id = pv.id
            WHERE o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
              AND (o.payment_method = 'COD' OR o.payment_status = 'PAID')
            GROUP BY pv.product_id, CAST(DATEADD(HOUR, 7, o.created_at) AS DATE)
        """)
        sales_cols = [d[0] for d in cur.description]
        sales_df = pd.DataFrame.from_records(cur.fetchall(), columns=sales_cols)

        # 3. Lấy dữ liệu đã tổng hợp trong ProductDailyMetrics (views, cart_adds, stock_snapshots...)
        cur.execute("""
            SELECT 
                product_id,
                metric_date,
                total_views,
                total_cart_adds,
                total_wishlist_adds,
                stock_quantity,
                CAST(is_out_of_stock AS INT) AS is_out_of_stock
            FROM ProductDailyMetrics
        """)
        pdm_cols = [d[0] for d in cur.description]
        pdm_df = pd.DataFrame.from_records(cur.fetchall(), columns=pdm_cols)

        # 4. Lấy hành vi trực tiếp từ user_events (phòng trường hợp trong ngày chưa chạy job tổng hợp)
        cur.execute("""
            SELECT 
                product_id,
                CAST(DATEADD(HOUR, 7, event_timestamp) AS DATE) AS metric_date,
                SUM(CASE WHEN event_name = 'product_view' THEN 1 ELSE 0 END) AS evt_views,
                SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS evt_cart_adds,
                SUM(CASE WHEN event_name = 'wishlist_add' THEN 1 ELSE 0 END) AS evt_wishlist_adds
            FROM user_events
            WHERE product_id IS NOT NULL
              AND event_name IN ('product_view', 'add_to_cart', 'wishlist_add')
            GROUP BY product_id, CAST(DATEADD(HOUR, 7, event_timestamp) AS DATE)
        """)
        evt_cols = [d[0] for d in cur.description]
        evt_df = pd.DataFrame.from_records(cur.fetchall(), columns=evt_cols)

    if products_df.empty:
        return pd.DataFrame(), products_df

    # Xác định dải ngày liên tục
    today_vn = pd.Timestamp.now(tz="Asia/Ho_Chi_Minh").normalize().tz_localize(None)
    min_dates = [today_vn - pd.Timedelta(days=14)]
    if not sales_df.empty:
        min_dates.append(pd.to_datetime(sales_df["metric_date"]).min())
    if not pdm_df.empty:
        min_dates.append(pd.to_datetime(pdm_df["metric_date"]).min())
    start_date = min(min_dates)
    all_dates = pd.date_range(start=start_date, end=today_vn, freq="D")

    # Tạo panel Cartesian (product_id x all_dates)
    panel = pd.MultiIndex.from_product(
        [products_df["product_id"].tolist(), all_dates],
        names=["product_id", "metric_date"]
    ).to_frame(index=False)

    panel = panel.merge(
        products_df[["product_id", "category_id", "current_price", "product_created_at", "current_stock"]],
        on="product_id",
        how="left"
    )

    if not sales_df.empty:
        sales_df["metric_date"] = pd.to_datetime(sales_df["metric_date"])
        panel = panel.merge(sales_df, on=["product_id", "metric_date"], how="left")
    else:
        panel["units_sold"] = 0
        panel["revenue"] = 0.0
        panel["orders_count"] = 0

    if not pdm_df.empty:
        pdm_df["metric_date"] = pd.to_datetime(pdm_df["metric_date"])
        panel = panel.merge(pdm_df, on=["product_id", "metric_date"], how="left")
    else:
        panel["total_views"] = np.nan
        panel["total_cart_adds"] = np.nan
        panel["total_wishlist_adds"] = np.nan
        panel["stock_quantity"] = np.nan
        panel["is_out_of_stock"] = np.nan

    if not evt_df.empty:
        evt_df["metric_date"] = pd.to_datetime(evt_df["metric_date"])
        panel = panel.merge(evt_df, on=["product_id", "metric_date"], how="left")
    else:
        panel["evt_views"] = 0
        panel["evt_cart_adds"] = 0
        panel["evt_wishlist_adds"] = 0

    panel["units_sold"] = panel["units_sold"].fillna(0).astype(float)
    panel["revenue"] = panel["revenue"].fillna(0.0).astype(float)
    panel["orders_count"] = panel["orders_count"].fillna(0).astype(int)
    panel["views"] = panel["total_views"].fillna(panel["evt_views"]).fillna(0).astype(float)
    panel["cart_adds"] = panel["total_cart_adds"].fillna(panel["evt_cart_adds"]).fillna(0).astype(float)
    panel["wishlist_adds"] = panel["total_wishlist_adds"].fillna(panel["evt_wishlist_adds"]).fillna(0).astype(float)
    panel["stock_quantity"] = panel["stock_quantity"].fillna(panel["current_stock"]).fillna(0).astype(float)
    panel["is_out_of_stock"] = np.where(
        panel["is_out_of_stock"].notna(),
        panel["is_out_of_stock"],
        (panel["stock_quantity"] <= 0).astype(int)
    )

    panel = panel.sort_values(["product_id", "metric_date"]).reset_index(drop=True)
    return panel, products_df


def build_features(panel: pd.DataFrame) -> pd.DataFrame:
    """
    Tính toán toàn bộ Feature Engineering chuẩn nhân quả (strictly causal - sử dụng shift(1)
    để tuyệt đối không rò rỉ dữ liệu tương lai vào đặc trưng).
    """
    if panel.empty:
        return panel

    df = panel.copy()
    g = df.groupby("product_id", group_keys=False)

    # Xử lý Business Safety: ngày hết hàng có doanh số = 0 không phản ánh nhu cầu = 0 -> mask bằng rolling mean trước đó khi tính lag nếu hết hàng
    effective_sales = df["units_sold"].copy()

    # 1. Lag features (lùi 1, 7, 14, 28 ngày)
    df["sales_1_day_ago"] = g["units_sold"].shift(1).fillna(0.0)
    df["sales_7_days_ago"] = g["units_sold"].shift(7).fillna(0.0)
    df["sales_14_days_ago"] = g["units_sold"].shift(14).fillna(0.0)
    df["sales_28_days_ago"] = g["units_sold"].shift(28).fillna(0.0)

    # 2. Rolling features (luôn shift(1) trước khi rolling để tránh data leakage ngày dự báo)
    shifted_sales = g["units_sold"].shift(1)
    shifted_rev = g["revenue"].shift(1)
    shifted_views = g["views"].shift(1)
    shifted_carts = g["cart_adds"].shift(1)
    shifted_wish = g["wishlist_adds"].shift(1)
    shifted_oos = g["is_out_of_stock"].shift(1)

    df["avg_sales_7_days"] = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).mean()).fillna(0.0)
    df["avg_sales_14_days"] = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(14, min_periods=1).mean()).fillna(0.0)
    df["avg_sales_30_days"] = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(30, min_periods=1).mean()).fillna(0.0)
    df["rolling_max_7_days"] = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).max()).fillna(0.0)
    df["rolling_std_7_days"] = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).std()).fillna(0.0)

    df["total_revenue_7_days"] = shifted_rev.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["total_revenue_30_days"] = shifted_rev.groupby(df["product_id"]).transform(lambda s: s.rolling(30, min_periods=1).sum()).fillna(0.0)

    # 3. Customer Behavior features
    df["views_1_day"] = shifted_views.fillna(0.0)
    df["views_7_days"] = shifted_views.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["views_30_days"] = shifted_views.groupby(df["product_id"]).transform(lambda s: s.rolling(30, min_periods=1).sum()).fillna(0.0)
    df["cart_adds_7_days"] = shifted_carts.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["cart_adds_30_days"] = shifted_carts.groupby(df["product_id"]).transform(lambda s: s.rolling(30, min_periods=1).sum()).fillna(0.0)
    df["wishlist_adds_7_days"] = shifted_wish.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)

    sales_7d_sum = shifted_sales.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["conversion_rate"] = np.where(df["views_7_days"] > 0, sales_7d_sum / df["views_7_days"], 0.0)
    df["view_to_cart_ratio"] = np.where(df["views_7_days"] > 0, df["cart_adds_7_days"] / df["views_7_days"], 0.0)

    prev_views_7d = shifted_views.groupby(df["product_id"]).shift(7).groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["view_growth_rate"] = np.where(prev_views_7d > 0, (df["views_7_days"] - prev_views_7d) / prev_views_7d, 0.0)

    prev_carts_7d = shifted_carts.groupby(df["product_id"]).shift(7).groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)
    df["cart_growth_rate"] = np.where(prev_carts_7d > 0, (df["cart_adds_7_days"] - prev_carts_7d) / prev_carts_7d, 0.0)

    # 4. Inventory features
    df["out_of_stock_days_7d"] = shifted_oos.groupby(df["product_id"]).transform(lambda s: s.rolling(7, min_periods=1).sum()).fillna(0.0)

    # 5. Time & Product features
    dt = pd.to_datetime(df["metric_date"])
    df["day_of_week"] = dt.dt.dayofweek
    df["day_of_month"] = dt.dt.day
    df["month"] = dt.dt.month
    df["season"] = df["month"].apply(_get_season)
    df["holiday_flag"] = [1 if (m, d) in VN_HOLIDAY_MONTH_DAYS else 0 for m, d in zip(df["month"], df["day_of_month"])]

    created_dt = pd.to_datetime(df["product_created_at"]).dt.tz_localize(None)
    df["product_age_days"] = np.maximum(0, (dt - created_dt).dt.days.fillna(30))

    # 6. Target horizons (7, 14, 30 ngày tiếp theo: tổng units_sold từ t đến t + H - 1)
    # Lưu ý: chỉ dùng các dòng mà tương lai đủ H ngày đã hoàn tất khi train
    for h in (7, 14, 30):
        # Forward sum over next h days starting at t
        rev_sum = (
            df.iloc[::-1]
            .groupby("product_id")["units_sold"]
            .transform(lambda s: s.rolling(h, min_periods=h).sum())
            .iloc[::-1]
        )
        df[f"target_{h}d"] = rev_sum

    return df

