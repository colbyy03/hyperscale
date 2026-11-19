import polars as pl


def resample_15min(df):
    """Per sensor and 15-minute window: mean_temp, n and a stuck flag, sorted by sensor and window."""
    return (
        df.sort("sensor", "ts")
        .group_by_dynamic("ts", every="15m", group_by="sensor")
        .agg(
            pl.col("temp").mean().alias("mean_temp"),
            pl.len().alias("n"),
            pl.col("temp").std().alias("sd"),
        )
        .with_columns(((pl.col("sd") == 0) & (pl.col("n") >= 10)).alias("stuck"))
        .rename({"ts": "window"})
        .select("sensor", "window", "mean_temp", "n", "stuck")
        .sort("sensor", "window")
    )
