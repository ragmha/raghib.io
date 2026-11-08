import os
import tempfile
import unittest
from unittest.mock import patch

import fde_demand


class DemandTests(unittest.TestCase):
    def test_experience_context(self):
        cases = [
            ("For 10+ years we have built software. You need 3 years of experience.", 3),
            ("For 10-15 years we have built software. You need 2+ years of Python experience.", 2),
            ("Requirements: 3-5 years of software engineering experience.", 3),
            ("Requirements: 4 to 6 years of experience.", 4),
            ("Requirements: 1 year of experience.", 1),
            ("For 10+ years we have built software.", None),
        ]
        for text, expected in cases:
            with self.subTest(text=text):
                self.assertEqual(fde_demand.first_number(fde_demand.YEARS, text.lower()), expected)

    def test_description_cache_expiry(self):
        role = {"href": "/roles/example"}
        with tempfile.TemporaryDirectory() as cache, patch.object(fde_demand, "CACHE", cache):
            path = os.path.join(cache, "roles_example.txt")
            with patch.object(fde_demand, "fetch", return_value='<div class="description">Python</article>'):
                self.assertEqual(fde_demand.describe(role), "python")

            os.utime(path, (10000, 10000))
            with patch("time.time", return_value=13599), patch.object(
                fde_demand, "fetch", side_effect=AssertionError("recent cache must be reused")
            ):
                self.assertEqual(fde_demand.describe(role), "python")

            with patch("time.time", return_value=13600), patch.object(
                fde_demand, "fetch", return_value='<div class="description">Rust</article>'
            ):
                self.assertEqual(fde_demand.describe(role), "rust")
            with open(path, encoding="utf-8") as cached:
                self.assertEqual(cached.read(), "Rust")


if __name__ == "__main__":
    unittest.main(failfast=True)
