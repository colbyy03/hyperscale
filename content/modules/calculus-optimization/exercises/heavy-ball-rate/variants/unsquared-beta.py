# expect: tuned(1, 100)
import numpy as np


def heavy_ball_matrix(lam, lr, beta):
    return np.array([[1.0 + beta - lr * lam, -beta], [1.0, 0.0]])


def worst_rate(mu, L, lr, beta, n=401):
    lams = np.linspace(mu, L, n)
    M = np.zeros((n, 2, 2))
    M[:, 0, 0] = 1.0 + beta - lr * lams
    M[:, 0, 1] = -beta
    M[:, 1, 0] = 1.0
    return float(np.abs(np.linalg.eigvals(M)).max())


def tuned(mu, L):
    rl, rm = np.sqrt(L), np.sqrt(mu)
    return 4.0 / (rl + rm) ** 2, (rl - rm) / (rl + rm)
