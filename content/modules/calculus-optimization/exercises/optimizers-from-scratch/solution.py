import numpy as np


class Momentum:
    """Heavy-ball momentum: v <- beta*v - lr*g; w <- w + v."""

    def __init__(self, lr, beta=0.9):
        self.lr, self.beta = lr, beta
        self.v = None

    def step(self, w, g):
        if self.v is None:
            self.v = np.zeros_like(w, dtype=float)
        self.v = self.beta * self.v - self.lr * np.asarray(g, dtype=float)
        return w + self.v


class AdamW:
    """Adam with bias correction and decoupled weight decay."""

    def __init__(self, lr, beta1=0.9, beta2=0.999, eps=1e-8, weight_decay=0.0):
        self.lr, self.beta1, self.beta2, self.eps, self.weight_decay = lr, beta1, beta2, eps, weight_decay
        self.m = self.s = None
        self.t = 0

    def step(self, w, g):
        g = np.asarray(g, dtype=float)
        if self.m is None:
            self.m, self.s = np.zeros_like(g), np.zeros_like(g)
        self.t += 1
        self.m = self.beta1 * self.m + (1 - self.beta1) * g
        self.s = self.beta2 * self.s + (1 - self.beta2) * g**2
        mh = self.m / (1 - self.beta1**self.t)
        sh = self.s / (1 - self.beta2**self.t)
        return w - self.lr * (mh / (np.sqrt(sh) + self.eps) + self.weight_decay * w)
