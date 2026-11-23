# expect: AdamW's first step (should be −lr·sign(g))
import numpy as np


class Momentum:
    def __init__(self, lr, beta=0.9):
        self.lr, self.beta, self.v = lr, beta, None

    def step(self, w, g):
        if self.v is None:
            self.v = np.zeros_like(w, dtype=float)
        self.v = self.beta * self.v - self.lr * g
        return w + self.v


class AdamW:
    def __init__(self, lr, beta1=0.9, beta2=0.999, eps=1e-8, weight_decay=0.0):
        self.lr, self.beta1, self.beta2, self.eps, self.weight_decay = lr, beta1, beta2, eps, weight_decay
        self.m = self.s = None

    def step(self, w, g):
        g = np.asarray(g, dtype=float)
        if self.m is None:
            self.m, self.s = np.zeros_like(g), np.zeros_like(g)
        self.m = self.beta1 * self.m + (1 - self.beta1) * g
        self.s = self.beta2 * self.s + (1 - self.beta2) * g**2
        return w - self.lr * (self.m / (np.sqrt(self.s) + self.eps) + self.weight_decay * w)
