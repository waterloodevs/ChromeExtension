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

http_auth = HTTPTokenAuth(scheme='Token')

cred = credentials.Certificate('kino-extension-firebase-adminsdk-mrn7d-cca5ca5e4c.json')
default_app = firebase_admin.initialize_app(cred)

DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'


app = Flask(__name__)
db = SQLAlchemy(app)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SSL_mode = 'allow'

STORES = [
    {'name': 'Amazon', 'url': 'www.amazon.com'},
    {'name': 'Walmart', 'url': 'www.walmart.com'},
    {'name': 'Ebay', 'url': 'www.ebay.com'}
]


class User(db.Model):

    __tablename__ = "users"

    uid = db.Column(db.String, primary_key=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    transactions = db.Column(JSON, nullable=False)
    mobile_app = db.Column(db.Boolean, nullable=False)
    fcm_token = db.Column(db.String)

    def __init__(self, uid, email, balance=0, transactions=None,
                 mobile_app=False, fcm_token=None):
        if transactions is None:
            transactions = []
        self.uid = uid
        self.email = email
        self.balance = balance
        self.transactions = transactions
        self.mobile_app = mobile_app
        self.fcm_token = fcm_token

    def __repr__(self):
        return "email: {}, balance: {}"\
            .format(self.email, self.balance)


@http_auth.verify_token
def verify_token(fb_id_token):
    try:
        decoded_token = auth.verify_id_token(fb_id_token)
        g.uid = decoded_token['uid']
    except Exception as err:
        return False
    return True

# def get_uid(fb_id_token):
#     decoded_token = auth.verify_id_token(fb_id_token)
#     uid = decoded_token['uid']
#     return uid


@app.route('/register', methods=['POST'])
@http_auth.login_required
def register():
    email = str(auth.get_user(g.uid).email)
    user = User(uid=g.uid, email=email)
    db.session.add(user)
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return Response(status=500)
    return Response(status=201)


@app.route('/update_fcm_token', methods=['POST'])
@http_auth.login_required
def update_fcm_token():
    if 'fcm_token' not in request.get_json():
        return jsonify(), 500
    fcm_token = request.get_json()['fcm_token']
    user = User.query.filter_by(uid=g.uid).first()
    user.fcm_token = fcm_token
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return jsonify(), 500
    return jsonify(), 201


@app.route('/')
@http_auth.login_required
def index():
    return jsonify({"Message": "Welcome to the Kino Api"}), 200


@app.route('/user_data')
@http_auth.login_required
def user_data():
    user = User.query.filter_by(uid=g.uid).first()
    return jsonify({
        "stores": STORES,
        "balance": user.balance,
        "transactions": user.transactions
    }), 200


@app.route('/stores')
def data():
    return jsonify({"stores": STORES}), 200


@app.route('/url')
@http_auth.login_required
def affiliate_link():
    user = User.query.filter_by(uid=g.uid).first()
    # Every url needs to have http(s):// at the start
    url = "http://www.google.com"
    # generate the affiliate url
    return jsonify({"url": url}), 200


def notify_user(user, transaction):
    message = messaging.Message(
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(
                title='$GOOG up 1.43% on the day',
                body='$GOOG gained 11.80 points to close at 835.67, up 1.43% on the day.',
                silent=True
            ),
        ),
        # notification=messaging.Notification(
        #     title="title",
        #     body="body"
        # ),
        # data={'transaction': transaction},
        token=user.fcm_token,
    )
    response = messaging.send(message)
    # Response is a message ID string.
    print('Successfully sent message: ', response)


def email_user(user, transaction):
    return


def new_transaction(uid, transaction):
    user = User.query.filter_by(uid=uid).first()
    if user is None:
        raise Exception("Invalid uid for new transaction: {}".format(uid))
    notify_user(user, transaction)
    email_user(user, transaction)
    return


if __name__ == '__main__':
    app.run(debug=True)
