import numpy as np


def steady_state(links, q, t_coolant):
    """Node temperatures (°C) of a thermal network at steady state.

    links: rows (i, j, g) with conductance g in W/K; j = -1 is the coolant at t_coolant.
    q: heat generated at each node, in W.
    """
    raise NotImplementedError("steady_state is not written yet")
