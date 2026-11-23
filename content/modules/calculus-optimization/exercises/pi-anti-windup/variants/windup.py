# expect: the integral wound up while the valve was pinned at 100%
class PI:
    def __init__(self, kp, ki, ts, u_min=0.0, u_max=1.0, u0=0.5):
        self.kp, self.ki, self.ts = kp, ki, ts
        self.u_min, self.u_max, self.u0 = u_min, u_max, u0
        self.s = 0.0

    def step(self, setpoint, measurement):
        e = measurement - setpoint
        self.s += self.ts * e  # always integrates
        u = self.u0 + self.kp * e + self.ki * self.s
        return min(max(u, self.u_min), self.u_max)
