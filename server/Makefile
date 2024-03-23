up:
	pipenv run python3 app.py

pull-package:
	pipenv run pip3 freeze > requirements.txt

gunicorn -k uvicorn.workers.UvicornWorker --bind "0.0.0.0:8080" --log-level debug app:app