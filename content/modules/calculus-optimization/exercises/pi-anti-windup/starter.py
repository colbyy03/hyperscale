class PI:
    """Supply-air PI controller for a chilled-water valve, with anti-windup."""

    def __init__(self, kp, ki, ts, u_min=0.0, u_max=1.0, u0=0.5):
        self.kp, self.ki, self.ts = kp, ki, ts
        self.u_min, self.u_max, self.u0 = u_min, u_max, u0
        self.s = 0.0

    def step(self, setpoint, measurement):
        raise NotImplementedError("PI.step is not written yet")
