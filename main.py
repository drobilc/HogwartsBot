import re
import praw
import dataset
import time
import datetime
import json

with open('config.json') as data_file:
    data = json.load(data_file)

client_id = data['client_id']
client_secret = data['client_secret']
username = data['username']
password = data['password']

casMedKomentarji = 10 * 60 # 10 minut

db = dataset.connect('sqlite:///database.db')
table = db.create_table('points', primary_id='comment_id', primary_type=db.types.string(20))

points = {
	"gryffindor": 0,
	"hufflepuff": 0,
	"ravenclaw": 0,
	"slytherin": 0
}

# Bots signature
signature = """You can check if your favourite dorm is winning at [http://www.dila.si/](http://www.dila.si/).

*****
I'm a bot, bleep, bloop. You can read my rules [here](https://gist.github.com/drobilc/1734f6b3e02941213ba9056876db5ec2). If you want to contact my owner, you can message him [here](https://www.reddit.com/message/compose/?to=drobilc)."""

# Current scoreboard
scoreboard = """House name|Points
:--|:--
Gryffindor|{gryffindor}
Hufflepuff|{hufflepuff}
Ravenclaw|{ravenclaw}
Slytherin|{slytherin}"""

def checkComment(comment):
	regex = re.compile(r"(-?\d+) points (for|to) (Gryffindor|Hufflepuff|Ravenclaw|Slytherin)", flags=re.IGNORECASE)
	match = regex.search(comment)
	if match and len(match.groups()) >= 3:
		pointsString = match.group(1)
		points = int(match.group(1))
		fixedPoints = min(max(-20, points), 20)
		if fixedPoints != points:
			return {"points": fixedPoints, "wrongPoints": pointsString, "house": match.group(3).lower()}
		else:
			return {"points": fixedPoints, "house": match.group(3).lower()}

def reply(comment, text):
	commentText = text + "\n\n" + signature
	comment.reply(commentText)

def getScoreBoard():
	return scoreboard.format(**points)

if __name__ == "__main__":

	print("Reading data from database")
	allData = table.find()
	for row in allData:
		numberOfPoints = row["points"]
		house = row["house"]
		points[house] += numberOfPoints

	print("Data read, score: {}".format(points))

	print("Logging in to Reddit.com")
	reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent='HogwartsBot bot', username=username, password=password)

	print("Reading comments")

	for comment in reddit.subreddit('all').stream.comments():
		try:
			# Check if comment is already in database
			commentInDatabase = table.find_one(comment_id=comment.id)
			
			# If comment is not in database, check it, maybe reply to it
			if commentInDatabase == None:

				result = checkComment(comment.body)

				if result:
					# Get comment author username
					commentAuthor = comment.author.name

					print("Result found! Comment id: {}, author: {}".format(comment.id, commentAuthor))

					# Check if user already gave points to house in the last hour
					userData = list(table.find(user=commentAuthor, order_by=['-date']))
					pretekelCas = 10 ** 9

					if userData and len(userData) > 0:
						now = datetime.datetime.now()
						then = datetime.datetime.fromtimestamp(userData[0]["date"])
						pretekelCas = abs((then - now).total_seconds())

					if (pretekelCas > casMedKomentarji):
						# Insert comment into database, so we don't check it again
						table.insert({"comment_id": comment.id, "user": commentAuthor, "points": result["points"], "house": result["house"], "date": comment.created_utc})
						# Update scoreboard
						points[result["house"]] += result["points"]
						# Reply to comment with current stats
						if "wrongPoints" in result:
							reply(comment, "Sorry, **{}**, but you can not give **{} points** to **{}**.\n\nI'll give them **{} points** instead.\n\nCurrent score is displayed below\n\n{}".format(commentAuthor, result["wrongPoints"], result["house"].title(), result["points"], getScoreBoard()))
						else:
							reply(comment, "Thank you **{}**, for giving **{} points** to **{}**!\n\nCurrent score is displayed below\n\n{}".format(commentAuthor, result["points"], result["house"].title(), getScoreBoard()))
					else:
						reply(comment, "Sorry **{}**, but you can only vote once every {} minutes. Please try again later.".format(commentAuthor, casMedKomentarji // 60))
		except Exception as e:
			print("Error({0}): {1}".format(e.errno, e.strerror))