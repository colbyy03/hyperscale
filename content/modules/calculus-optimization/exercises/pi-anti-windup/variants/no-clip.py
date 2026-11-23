# expect: clip to [0, 1]
class PI:
    def __init__(self, kp, ki, ts, u_min=0.0, u_max=1.0, u0=0.5):
        self.kp, self.ki, self.ts = kp, ki, ts
        self.u_min, self.u_max, self.u0 = u_min, u_max, u0
        self.s = 0.0

    def step(self, setpoint, measurement):
        e = measurement - setpoint
        cand = self.s + self.ts * e
        u = self.u0 + self.kp * e + self.ki * cand
        if (u > self.u_max and e > 0) or (u < self.u_min and e < 0):
            u = self.u0 + self.kp * e + self.ki * self.s
        else:
            self.s = cand
        return u
