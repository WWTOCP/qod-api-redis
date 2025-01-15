pip install -r requirements.txt
pytest test_qod_api.py -v -s
pytest --html=report.html