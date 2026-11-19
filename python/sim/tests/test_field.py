"""Tests for the rack-level inlet field (hyperscale_sim.field)."""
import statistics

from hyperscale_sim import Controls, Hall, InletField, Layout


def settled(hours=1.0, **controls):
    h = Hall("summer-day", dt=10.0, controls=Controls(**controls))
    h.run(hours * 3600)
    return h


def test_names_and_layout():
    """Four pods × two rows × twelve racks × three heights, uniquely named."""
    f = InletField(4)
    assert len(f.names) == 288 and len(set(f.names)) == 288
    assert f.names[0] == "pod1.A01.low" and f.names[-1] == "pod4.B12.top"


def test_reduces_to_the_lumped_model():
    """No offsets, noise or starvation: low sensors read the cold aisle, top sensors average the lumped top-of-rack value."""
    h = settled(fan_speed=1.0)
    f = InletField(4, offset_sd=0.0, noise=0.0)
    t = f.truth(h)
    for z, pod in enumerate(h.out["pods"]):
        lows = [t[f"pod{z + 1}.{r}{k:02d}.low"] for r in "AB" for k in range(1, 13)]
        tops = [t[f"pod{z + 1}.{r}{k:02d}.top"] for r in "AB" for k in range(1, 13)]
        assert max(abs(v - pod["inlet"]) for v in lows) < 1e-12
        assert abs(statistics.fmean(tops) - pod["inlet_top"]) < 1e-9


def test_containment_breach_heats_the_row_ends_first():
    """A breach raises top-of-rack readings, most at the ends of the rows."""
    f = InletField(4, offset_sd=0.0, noise=0.0)
    before = f.truth(settled(fan_speed=1.0))
    h = Hall("summer-day", dt=10.0, controls=Controls(fan_speed=1.0))
    h.set_containment(1, 0.3)
    h.run(3600)
    after = f.truth(h)
    rise = {k: after[f"pod2.A{k:02d}.top"] - before[f"pod2.A{k:02d}.top"] for k in (1, 6, 12)}
    assert rise[1] > rise[6] > 0 and rise[12] > rise[6], rise
    assert after["pod1.A01.top"] - before["pod1.A01.top"] < 0.5 * rise[1], "the other pods shouldn't see the breach at the same strength"


def test_slow_fans_starve_the_far_end():
    """With the fans slowed, racks far from the CRAH warm up more than the near ones."""
    f = InletField(4, offset_sd=0.0, noise=0.0)
    fast, slow = f.truth(settled(fan_speed=1.0)), f.truth(settled(fan_speed=0.45))
    near = slow["pod1.A01.top"] - fast["pod1.A01.top"]
    far = slow["pod1.A12.top"] - fast["pod1.A12.top"]
    assert far > near + 0.5, (near, far)


def test_noise_and_reproducibility():
    """Readings scatter around the truth by the stated noise, and a seed reproduces them."""
    h = settled()
    a, b = InletField(4, seed=3, noise=0.05), InletField(4, seed=3, noise=0.05)
    ra, rb, t = a.read(h), b.read(h), a.truth(h)
    assert ra == rb
    resid = [ra[n] - t[n] for n in a.names]
    assert 0.04 < statistics.pstdev(resid) < 0.06
    assert InletField(4, Layout(rows=1, racks=8)).names[-1] == "pod4.A08.top"
