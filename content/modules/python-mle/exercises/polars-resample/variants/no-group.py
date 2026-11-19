# expect: Group by sensor as well as by time
import polars as pl


def resample_15min(df):
    return (
        df.sort("ts")
        .group_by_dynamic("ts", every="15m")
        .agg(pl.col("sensor").first(), pl.col("temp").mean().alias("mean_temp"), pl.len().alias("n"), pl.col("temp").std().alias("sd"))
        .with_columns(((pl.col("sd") == 0) & (pl.col("n") >= 10)).alias("stuck"))
        .rename({"ts": "window"})
        .select("sensor", "window", "mean_temp", "n", "stuck")
        .sort("sensor", "window")
    )
