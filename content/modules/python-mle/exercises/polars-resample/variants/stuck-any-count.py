# expect: Flag windows with at least 10 readings
import polars as pl


def resample_15min(df):
    return (
        df.sort("sensor", "ts")
        .group_by_dynamic("ts", every="15m", group_by="sensor")
        .agg(pl.col("temp").mean().alias("mean_temp"), pl.len().alias("n"), pl.col("temp").n_unique().alias("u"))
        .with_columns((pl.col("u") == 1).alias("stuck"))
        .rename({"ts": "window"})
        .select("sensor", "window", "mean_temp", "n", "stuck")
        .sort("sensor", "window")
    )
