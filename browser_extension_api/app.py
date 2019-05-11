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

STORES = [
    {'name': 'Amazon', 'url': 'www.amazon.com'},
    {'name': 'Walmart', 'url': 'www.walmart.com'},
    {'name': 'Ebay', 'url': 'www.ebay.com'}
]

EARN_PRICE_PER_DOLLAR = 100
SPEND_PRICE_PER_DOLLAR = 1000

GIFTCARD_TYPES = ['Amazon',
                  'Mcdonalds',
                  'Uber',
                  'Spotify',
                  'Netflix']
GIFTCARD_AMOUNTS = [5, 10, 25]
MAX_GIFTCARD_QUANTITY = 10
MIN_GIFTCARD_QUANTITY = 1


class User(db.Model):

    __tablename__ = "users"

    uid = db.Column(db.String, primary_key=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    transactions = db.Column(JSON, nullable=False)
    android_fcm_token = db.Column(db.String)
    web_fcm_token = db.Column(db.String)
    public_address = db.Column(db.String)

    def __init__(self, uid, email, balance=0, transactions=None,
                 android_fcm_token=None, web_fcm_token=None, public_address=None):
        if transactions is None:
            transactions = []
        self.uid = uid
        self.email = email
        self.balance = balance
        self.transactions = transactions
        self.android_fcm_token = android_fcm_token
        self.web_fcm_token = web_fcm_token
        self.public_address = public_address

    def __repr__(self):
        return "email: {}, balance: {}"\
            .format(self.email, self.balance)


# Using this to verify authenticated calls where login is required
@http_auth.verify_token
def verify_token(fb_id_token):
    try:
        decoded_token = auth.verify_id_token(fb_id_token)
        g.uid = decoded_token['uid']
    except Exception as err:
        return False
    return True


@app.route('/', methods=['GET'])
@http_auth.login_required
def index():
    return jsonify({"Message": "Welcome to the Kino Api"}), 200


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
        return jsonify(), 500
    return jsonify(), 201


@app.route('/update_fcm_token', methods=['POST'])
@http_auth.login_required
def update_fcm_token():
    user = User.query.filter_by(uid=g.uid).first()
    if 'web_fcm_token' in request.get_json():
        web_fcm_token = request.get_json()['web_fcm_token']
        user.web_fcm_token = web_fcm_token
    elif 'android_fcm_token' in request.get_json():
        android_fcm_token = request.get_json()['android_fcm_token']
        user.android_fcm_token = android_fcm_token
    else:
        return jsonify(), 500
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return jsonify(), 500
    return jsonify(), 201


# @app.route('/user_data', methods=['GET'])
# @http_auth.login_required
# def user_data():
#     user = User.query.filter_by(uid=g.uid).first()
#     return jsonify({
#         "stores": STORES,
#         "balance": user.balance,
#         "transactions": user.transactions
#     }), 200


@app.route('/stores', methods=['GET'])
@http_auth.login_required
def stores():
    return jsonify({"stores": ['www.google.com', 'www.amazon.com']}), 200


@app.route('/affiliate_link', methods=['GET'])
@http_auth.login_required
def affiliate_link():
    user = User.query.filter_by(uid=g.uid).first()
    # Every url needs to have http(s):// at the start
    url = "http://www.google.com"
    # Generate the affiliate url
    return jsonify({"url": url}), 200


def notify_extension(user, transaction):
    message = messaging.Message(
        data={
            'title': 'title python',
            'body': 'body python'
        },
        token=user.fcm_token,
    )
    response = messaging.send(message)
    # Response is a message ID string.
    print('Successfully sent message: ', response)


# def notify_app(user, transaction):
#     # See documentation on defining a message payload.
#     message = messaging.Message(
#         data={
#             'kin': str(kin_amount),
#             'total_kin': str(user.kin),
#             'brands': brands,
#             'title': "Kino",
#             'body': "You just earned {} kin for your recent purchase at {}.".format(kin_amount, brands)
#         },
#         token=user.fcm_token,
#     )
#     # Send a message to the device corresponding to the provided registration token.
#     try:
#         response = messaging.send(message)
#     except:
#         # user has logged out
#
#     return

# 
# 
# def email_user(user, transaction):
#     return


# def new_transaction(uid, transaction):
#     user = User.query.filter_by(uid=uid).first()
#     if user is None:
#         raise Exception("Unable to find user for uid: {}".format(uid))
#     # Update user's balance in db
#     user.balance += calc_kin_amount(dollar_amount)
#     # Update user's transactions in db
#     user.transactions[transaction['id']] = transaction
#     try:
#         db.session.commit()
#     except AssertionError as err:
#         db.session.rollback()
#         # TODO: what happens if we error on the backend
#         raise Exception
#     notify_extension(user, transaction)
#     email_user(user, transaction)
#     if user.public_address:
#         # Build earn transaction based on user's public address if present
#         # Confirm user's balance matches the balance on the block-chain
#         notify_app(user, transaction)
#     return
# 
# 
# def calc_kin_amount(dollar_amount):
#     return dollar_amount * KIN_PER_DOLLAR
# 
#

@app.route('/update_public_address', methods=['POST'])
@http_auth.login_required
def update_public_address():
    if 'public_address' not in request.get_json():
        return jsonify(), 500
    public_address = request.get_json()['public_address']
    user = User.query.filter_by(uid=g.uid).first()
    user.public_address = public_address
    try:
        db.session.commit()
    except AssertionError as err:
        db.session.rollback()
        return jsonify(), 500
    # First time installing the app, create a earn transaction for the user's balance - no?
    return jsonify(), 201


def valid_order(order):
    # Ensure all information is present
    if not all(x in order for x in ['email', 'type', 'amount', 'quantity', 'total']):
        return False

    type = order['type']
    amount = int(order['amount'])
    quanity = int(order['quantity'])
    total = float(order['total'])

    # Ensure total is correct
    if total != quanity*amount*SPEND_PRICE_PER_DOLLAR:
        return False
    # Ensure the type of gift card exists
    if type not in GIFTCARD_TYPES:
        return False
    # Ensure the amount is one of the valid options
    if amount not in GIFTCARD_AMOUNTS:
        return False
    # Ensure the quantity is within bounds
    if not MIN_GIFTCARD_QUANTITY <= quanity <= MAX_GIFTCARD_QUANTITY:
        return False

    return True


@app.route('/buy_giftcard', methods=['POST'])
@http_auth.login_required
def buy_giftcard():
    order = request.get_json()
    if not valid_order(order):
        return jsonify(), 500
    # Get gift-card type, amount, email, and quantity
    type = order['type']
    email = order['email']
    amount = int(order['amount'])
    quanity = int(order['quantity'])
    total = float(order['total'])
    # Whitelist the spend transaction and send back to app
    # Add to transactions
    # Submit the order
    return jsonify(), 200


@app.route('/spend_price_per_dollar', methods=['GET'])
@http_auth.login_required
def spend_price_per_dollar():
    # TODO: Get price from an environment variable
    return jsonify({"price": SPEND_PRICE_PER_DOLLAR}), 200


if __name__ == '__main__':
    app.run()


