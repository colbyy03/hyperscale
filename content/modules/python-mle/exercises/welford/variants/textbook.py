# expect: cancels catastrophically
def running_mean_var(values):
    n = 0
    s = 0.0
    s2 = 0.0
    for x in values:
        n += 1
        s += x
        s2 += x * x
    if n == 0:
        raise ValueError("no values")
    mean = s / n
    return mean, s2 / n - mean * mean
