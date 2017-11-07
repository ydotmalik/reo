# Unit tests

To run the unit test cases, first run the test web server:
```
python unit-test-server.py [optional port number]
```

```unit-test-server.py``` is written in Python 2.

Go to ```http://127.0.0.1:8000``` (or whatever port number you chose) and click on file ```unit-test.html``` to run all the test cases.
Sometimes the test fail because of timing issues.  Run the test again, and it should pass.

For code coverage, click on "Enable coverage".