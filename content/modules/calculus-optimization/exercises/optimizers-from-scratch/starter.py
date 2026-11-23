import numpy as np


class Momentum:
    """Heavy-ball momentum: v <- beta*v - lr*g; w <- w + v."""

    def __init__(self, lr, beta=0.9):
        self.lr, self.beta = lr, beta

    def step(self, w, g):
        raise NotImplementedError("Momentum.step is not written yet")


class AdamW:
    """Adam with bias correction and decoupled weight decay."""

    def __init__(self, lr, beta1=0.9, beta2=0.999, eps=1e-8, weight_decay=0.0):
        self.lr, self.beta1, self.beta2, self.eps, self.weight_decay = lr, beta1, beta2, eps, weight_decay

    def step(self, w, g):
        raise NotImplementedError("AdamW.step is not written yet")
