# Leaderboard

This api collect user data and creates leaderboard.

Postman docs can be found here -> https://documenter.getpostman.com/view/3718926/TWDTLJLk

## Implementation

Redis and PostgreSQL is used for this project.

### PostgreSQL

- All user data is kept here, besides rank. 

### Redis Sorted Set

- There is a sorted set for all users. Global Rank is calculated in this set. Key is user id, value is the score.

- Also, there are smaller sorted sets for each country. Rank by country is calculated here. However, global rank is taken from global sorted set.


Thanks to this multi sorted set approach, Global leaderboard or country leaderboard is calculated less than 1 sec with more than 100.000 users. I did not opearate any performance test though.
