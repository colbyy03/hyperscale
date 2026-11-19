import numpy as np
import pytest


def check_pue(pue):
    """Raise AssertionError (or fail a pytest check) if `pue` breaks its specification.

    pue(facility_kwh, it_kwh):
      - accepts two numbers, or two equal-length sequences of interval energies;
      - returns total facility energy / total IT energy, as a float;
      - raises ValueError if total IT energy is zero or negative.
    """
    raise NotImplementedError("check_pue is not written yet")
