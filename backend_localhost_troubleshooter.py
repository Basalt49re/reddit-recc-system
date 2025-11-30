from flask import Flask

    # Create a Flask application instance
app = Flask(__name__)

    # Define a route for the root URL ("/")
@app.route("/")
def hello_world():
    return "<h1>Hello, World!</h1>"

    # Run the application if the script is executed directly
if __name__ == "__main__":
    app.run(debug=True, port=8000) # debug=True enables debug mode and auto-reloading
