import stripe
import requests
import json
import psycopg2
import psycopg2.extras
from flask import Flask, render_template, request, redirect, url_for, abort, g
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
    "www.amazon.com",
    "www.walmart.com",
    "www.ebay.com"
]


class User(db.Model):

    __tablename__ = "users"

    uid = db.Column(db.String, primary_key=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    balance = db.Column(db.Integer, nullable=False)
    transactions = db.Column(JSON, nullable=False)
    mobile_app = db.Column(db.Boolean, nullable=False)

    def __init__(self, uid, email, balance=0, transactions=[], mobile_app=False):
        self.uid = uid
        self.email = email
        self.balance = balance
        self.transactions = transactions
        self.mobile_app = mobile_app

    def __repr__(self):
        return "email: {}, balance: {}"\
            .format(self.email, self.balance)


@http_auth.verify_token
def verify_token(fb_id_token):
    try:
        g.uid = get_uid(fb_id_token)
        return True
    except:
        return False


def get_uid(fb_id_token):
    decoded_token = auth.verify_id_token(fb_id_token)
    uid = decoded_token['uid']
    return uid


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
        return '', 500
    return '', 201


@app.route('/')
@http_auth.login_required
def index():
    return jsonify({"Message": "Welcome to the Kino Api"}), 200


@app.route('/data')
@http_auth.login_required
def data():
    user = User.query.filter_by(uid=g.uid).first()
    return jsonify({
        "stores": STORES,
        "balance": user.balance,
        "transactions": user.transactions
    }), 200


@app.route('/affiliate_link/<url>/<id>')
@http_auth.login_required
def affiliate_link():
    user = User.query.filter_by(uid=g.uid).first()

    url = request.args.get('url')
    id = request.args.get('id')
    # generate the affiliate url
    return jsonify({"url": url}), 200


if __name__ == '__main__':
    app.run(debug=True)
