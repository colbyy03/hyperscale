# expect: fit() should return self
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted


class MedianScaler(BaseEstimator, TransformerMixin):
    def __init__(self, with_centering=True, quantile_range=(25.0, 75.0)):
        self.with_centering = with_centering
        self.quantile_range = quantile_range

    def fit(self, X, y=None):
        X = np.asarray(X, dtype=float)
        lo, hi = np.percentile(X, self.quantile_range, axis=0)
        self.center_ = np.median(X, axis=0) if self.with_centering else np.zeros(X.shape[1])
        self.scale_ = np.where(hi - lo == 0, 1.0, hi - lo)

    def transform(self, X):
        check_is_fitted(self)
        return (np.asarray(X, dtype=float) - self.center_) / self.scale_
