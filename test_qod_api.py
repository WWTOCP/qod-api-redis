import pytest
import requests

ENDPOINT = "http://localhost:8080"

@pytest.mark.repeat(10)  # Run the test 10 times
def test_can_call_endpoint():
    if "https" in ENDPOINT.lower():
        response = requests.get(ENDPOINT, verify=False)
    else:
        response = requests.get(ENDPOINT)

    assert response.status_code == 200

@pytest.mark.repeat(10)  # Run the test 10 times
def test_get_daily_quote():
    if "https" in ENDPOINT.lower():
        response = requests.get(ENDPOINT + "/daily", verify=False)
    else:
        response = requests.get(ENDPOINT + "/daily")
    
    #data = response.json();
    #print(data)

    assert response.status_code == 200
    
@pytest.mark.repeat(10)  # Run the test 10 times
def test_get_random_quote():
    if "https" in ENDPOINT.lower():
        response = requests.get(ENDPOINT + "/random", verify=False)
    else:
        response = requests.get(ENDPOINT + "/random")
    
    #data = response.json();
    #print(data)

    assert response.status_code == 200