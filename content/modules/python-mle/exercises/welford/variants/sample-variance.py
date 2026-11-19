# expect: divide by n
def running_mean_var(values):
    n = 0
    mean = 0.0
    m2 = 0.0
    for x in values:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    if n == 0:
        raise ValueError("no values")
    return mean, m2 / (n - 1) if n > 1 else 0.0
