import os
import datetime
import plaid
import json
import psycopg2
import psycopg2.extras
from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import firebase_admin
from firebase_admin import credentials, auth, messaging

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Welcome to the Kino Api!'


@app.route("/register_user", methods=['POST'])
def register_user():
    return


if __name__ == '__main__':
    app.run(debug=True)
