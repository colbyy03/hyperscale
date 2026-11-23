class PI:
    """Supply-air PI controller for a chilled-water valve, with anti-windup."""

    def __init__(self, kp, ki, ts, u_min=0.0, u_max=1.0, u0=0.5):
        self.kp, self.ki, self.ts = kp, ki, ts
        self.u_min, self.u_max, self.u0 = u_min, u_max, u0
        self.s = 0.0

    def step(self, setpoint, measurement):
        e = measurement - setpoint  # too warm: open the valve further
        cand = self.s + self.ts * e
        u = self.u0 + self.kp * e + self.ki * cand
        if (u > self.u_max and e > 0) or (u < self.u_min and e < 0):
            u = self.u0 + self.kp * e + self.ki * self.s  # saturated: don't integrate further into it
        else:
            self.s = cand
        return min(max(u, self.u_min), self.u_max)
