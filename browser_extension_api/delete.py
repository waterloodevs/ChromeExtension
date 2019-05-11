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

# This registration token comes from the client FCM SDKs.
registration_token = 'f_0YhB4pMxc:APA91bGK3XH6psmJGRlf-hMdhUZenxmhRFYhO0w1gMaWKVJoGj1HkFbr5NMdGNiSUOjLDGVitRyE_DMjSePF1ifPFT2RqB17PB5RuA3Ob2JMfu9XG9Mwf9u_elSzE2JLmB20GKrewebN'
# See documentation on defining a message payload.
message = messaging.Message(
    data={
        'title': 'title python',
        'body': 'body python',
        'new_stores': 'true',
    },

    # webpush=messaging.WebpushConfig(
    #     notification=messaging.WebpushNotification(
    #         title='title',
    #         body='body',
    #         silent=True
    #     ),
    # ),

    # notification=messaging.Notification(
    #     title='title',
    #     body='body'
    # ),
    token=registration_token,
)

# Send a message to the device corresponding to the provided
# registration token.
response = messaging.send(message)
# Response is a message ID string.
print('Successfully sent message:', response)