import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted


class MedianScaler(BaseEstimator, TransformerMixin):
    """Centre on the median and scale by an interquartile range, column by column."""

    def __init__(self, with_centering=True, quantile_range=(25.0, 75.0)):
        raise NotImplementedError("MedianScaler.__init__ is not written yet")

    def fit(self, X, y=None):
        raise NotImplementedError("MedianScaler.fit is not written yet")

    def transform(self, X):
        raise NotImplementedError("MedianScaler.transform is not written yet")
