import requests
import json
import psycopg2
import psycopg2.extras
from flask import Flask, render_template, request, redirect, url_for, abort, g, Response
from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import firebase_admin
from firebase_admin import credentials, auth, messaging
from flask_httpauth import HTTPTokenAuth
from flask_ngrok import run_with_ngrok

http_auth = HTTPTokenAuth(scheme='Token')

cred = credentials.Certificate('kino-extension-firebase-adminsdk-mrn7d-cca5ca5e4c.json')
default_app = firebase_admin.initialize_app(cred)

DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'


app = Flask(__name__)
run_with_ngrok(app)
db = SQLAlchemy(app)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SSL_mode = 'allow'

message = messaging.Message(
            data={
                'type': 'New Earn',
                'title': "Kino",
                'content': "You just earned {} kin for your recent purchase at"
            },
            token='dJwX4cIxfy0:APA91bHCD-XnrsirbWQ1EB1VCccs5sQiYJZ0tuIpre-iPnKmAvagPhGLw2PR4lj2GFJXwlusVlsG7NMjRKdda0Sa05RkfEZFFnMSX4TrQ1EUU6Ow1ipQEghfPTRLt-BnAOIpqL1-Qb-3',
        )
response = messaging.send(message)