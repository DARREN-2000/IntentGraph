import sys

class DummyService:
    """This is a dummy service."""
    def __init__(self) -> None:
        self.ready = True

    def run(self) -> None:
        sys.exit(0)

def help_function() -> None:
    print("Help!")
    sys.exit(0)
